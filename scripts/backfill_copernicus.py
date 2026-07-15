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
      { id: "ndvi", bands: 1 },
      { id: "ndmi", bands: 1 },
      { id: "cloud", bands: 1 },
      { id: "dataMask", bands: 1 }
    ]
  };
}

function evaluatePixel(sample) {
  // NDVI = (NIR - Red) / (NIR + Red)
  let ndvi = (sample.B08 + sample.B04 !== 0) ? (sample.B08 - sample.B04) / (sample.B08 + sample.B04) : 0;

  // NDMI = (NIR - SWIR) / (NIR + SWIR)
  let ndmi = (sample.B08 + sample.B11 !== 0) ? (sample.B08 - sample.B11) / (sample.B08 + sample.B11) : 0;
  
  // Klasyfikacja SCL: 3 (cień chmury), 8, 9, 10 (chmury)
  let isCloud = [3, 8, 9, 10].includes(sample.SCL) ? 1 : 0;
  let isValid = (sample.SCL !== 0) ? 1 : 0;
  
  return {
    ndvi: [ndvi],
    ndmi: [ndmi],
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
    # Używamy geometrii poligonu
    geometry = block['geometry']
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)

    payload = {
        "input": {
            "bounds": {
                "geometry": geometry,
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
    print(f"📡 Pobieranie telemetrii dla działki: {block['properties']['name']}...")
    
    resp = requests.post(STATS_API_URL, json=payload, headers=headers)
    if resp.status_code != 200:
        print(f"⚠️ Błąd API CDSE dla {block['properties']['name']}: {resp.text}")
        return []

    return resp.json().get("data", [])

def main():
    print("🚀 Start procesu Backfill (Poligony)...")
    
    # Pobieramy bloki jako GeoJSON przez RPC
    try:
        response = supabase.rpc("get_vineyard_blocks_geojson").execute()
        blocks_geojson = response.data
        if not blocks_geojson or not blocks_geojson.get('features'):
            print("❌ Brak działek w bazie Supabase.")
            return
        blocks = blocks_geojson['features']
    except Exception as e:
        print(f"❌ Błąd pobierania działek: {e}")
        return

    token = get_cdse_token()
    records_to_upsert = []

    for block in blocks:
        stats = fetch_block_data(token, block, days_back=365)
        
        for entry in stats:
            if 'outputs' not in entry: continue
            outputs = entry['outputs']
            
            ndvi_obj = outputs.get('ndvi', {}).get('bands', {}).get('B0')
            ndmi_obj = outputs.get('ndmi', {}).get('bands', {}).get('B0')
            cloud_obj = outputs.get('cloud', {}).get('bands', {}).get('B0')

            if not ndvi_obj or ndvi_obj.get('stats', {}).get('sampleCount', 0) == 0: continue
            
            ndvi_val = ndvi_obj['stats']['mean']
            ndmi_val = ndmi_obj['stats']['mean'] if ndmi_obj else 0
            cloud_pct = cloud_obj['stats']['mean'] * 100 if cloud_obj else 100
            date = entry['interval']['from'].split("T")[0]

            # Akceptujemy tylko dane o zachmurzeniu <= 40%
            if cloud_pct <= 40:
                records_to_upsert.append({
                    "block_id": block['properties']['id'],
                    "date": date,
                    "ndvi_mean": round(ndvi_val, 3),
                    "ndmi_mean": round(ndmi_val, 3),
                    "cloud_cover": round(cloud_pct, 1)
                })

    if records_to_upsert:
        print(f"💾 Wysyłanie {len(records_to_upsert)} odczytów do Supabase...")
        try:
            supabase.table("vineyard_stats").upsert(records_to_upsert, on_conflict="block_id, date").execute()
            print("✅ Backfill zakończony sukcesem!")
        except Exception as e:
            print(f"❌ Błąd zapisu: {e}")
    else:
        print("⚠️ Brak danych do zapisu.")

if __name__ == "__main__":
    main()
