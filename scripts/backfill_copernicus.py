import os
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

# Załadowanie zmiennych z pliku .env.local
load_dotenv('.env.local')

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
CLIENT_ID = os.environ.get("COPERNICUS_CLIENT_ID")
CLIENT_SECRET = os.environ.get("COPERNICUS_CLIENT_SECRET")

if not all([SUPABASE_URL, SUPABASE_KEY, CLIENT_ID, CLIENT_SECRET]):
    raise ValueError("Krytyczny błąd: Brak wymaganych zmiennych w .env.local")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
STATS_API_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics"

# Evalscript obliczający NDVI i NDMI
SENTINEL_EVALSCRIPT = """
//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "B11", "SCL"],
    output: [
      { id: "indices", bands: 2 },
      { id: "cloud", bands: 1 },
      { id: "dataMask", bands: 1 }
    ]
  };
}

function evaluatePixel(sample) {
  // NDVI = (NIR - RED) / (NIR + RED)
  let val_ndvi = sample.B08 + sample.B04;
  let ndvi = (val_ndvi !== 0) ? (sample.B08 - sample.B04) / val_ndvi : 0;
  
  // NDMI = (NIR - SWIR) / (NIR + SWIR)
  let val_ndmi = sample.B08 + sample.B11;
  let ndmi = (val_ndmi !== 0) ? (sample.B08 - sample.B11) / val_ndmi : 0;

  // Klasyfikacja SCL: 3 (cień chmury), 8, 9, 10 (chmury)
  let isCloud = [3, 8, 9, 10].includes(sample.SCL) ? 1 : 0;
  let isValid = (sample.SCL !== 0) ? 1 : 0;
  
  return {
    indices: [ndvi, ndmi],
    cloud: [isCloud],
    dataMask: [isValid]
  };
}
"""

def get_cdse_token() -> str:
    print("🔑 Autoryzacja w CDSE...")
    payload = {"grant_type": "client_credentials", "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET}
    resp = requests.post(TOKEN_URL, data=payload)
    resp.raise_for_status()
    return resp.json()["access_token"]

def fetch_block_data(token: str, block: dict, days_back: int = 365) -> list:
    # block['geom'] jest słownikiem GeoJSON
    geom = block['geom']
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)

    payload = {
        "input": {
            "bounds": {
                "geometry": geom,
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
            },
            "data": [{"type": "sentinel-2-l2a"}]
        },
        "aggregation": {
            "timeRange": {
                "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                "to": end_date.strftime("%Y-%m-%dT23:59:59Z")
            },
            "aggregationInterval": {"of": "P1D"},
            "evalscript": SENTINEL_EVALSCRIPT
        }
    }

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"📡 Pobieranie {days_back} dni telemetrii dla działki: {block['name']}...")
    
    resp = requests.post(STATS_API_URL, json=payload, headers=headers)
    if resp.status_code != 200:
        print(f"⚠️ Błąd API CDSE dla {block['name']}: {resp.text}")
        return []

    return resp.json().get("data", [])

def main():
    print("🚀 Start procesu Backfill dla Poligonów...")
    
    # Pobieramy bloki winnicy przez RPC (by dostać GeoJSON)
    try:
        response = supabase.rpc("get_vineyard_blocks_geojson").execute()
        blocks_fc = response.data
        if not blocks_fc or not blocks_fc.get('features'):
            print("❌ Brak bloków winnicy w bazie.")
            return

        blocks = [
            {
                "id": f['properties']['id'],
                "name": f['properties']['name'],
                "geom": f['geometry']
            } for f in blocks_fc['features']
        ]
    except Exception as e:
        print(f"❌ Błąd podczas pobierania bloków: {e}")
        return

    token = get_cdse_token()
    records_to_upsert = []

    for block in blocks:
        stats = fetch_block_data(token, block, days_back=365)
        
        for entry in stats:
            if 'outputs' not in entry: continue
            outputs = entry['outputs']
            
            indices_obj = outputs.get('indices', {}).get('bands', {})
            if not indices_obj: continue

            ndvi_stats = indices_obj.get('B0', {}).get('stats', {})
            ndmi_stats = indices_obj.get('B1', {}).get('stats', {})

            if ndvi_stats.get('sampleCount', 0) == 0: continue
            
            cloud_obj = outputs.get('cloud', {}).get('bands', {}).get('B0')
            cloud_pct = cloud_obj['stats']['mean'] * 100 if cloud_obj else 100
            date = entry['interval']['from'].split("T")[0]

            # Akceptujemy tylko dane o zachmurzeniu <= 40%
            if cloud_pct <= 40:
                records_to_upsert.append({
                    "block_id": block['id'],
                    "date": date,
                    "ndvi_mean": round(ndvi_stats['mean'], 3),
                    "ndmi_mean": round(ndmi_stats['mean'], 3),
                    "cloud_cover": round(cloud_pct, 1)
                })

    if records_to_upsert:
        print(f"💾 Wysyłanie {len(records_to_upsert)} odczytów do Supabase (vineyard_stats)...")
        try:
            # Dzielimy na paczki po 100, by nie przepełnić requestu
            for i in range(0, len(records_to_upsert), 100):
                batch = records_to_upsert[i:i+100]
                supabase.table("vineyard_stats").upsert(batch, on_conflict="block_id, date").execute()
            print("✅ Backfill zakończony sukcesem!")
        except Exception as e:
            print(f"❌ Błąd zapisu: {e}")
    else:
        print("⚠️ Brak danych do zapisu.")

if __name__ == "__main__":
    main()
