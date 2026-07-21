import os
import requests
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
    print("⚠️ Uwaga: Brak niektórych zmiennych w .env.local (proces pobierania danych CDSE pominie zapytania do API).")

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
STATS_API_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics"

# Evalscript liczący NDVI, NDMI (stres wodny) oraz zachmurzenie na bazie Scene Classification Layer (SCL)
EVALSCRIPT_VINEYARD = """
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
  let val_ndvi = sample.B08 + sample.B04;
  let ndvi = (val_ndvi !== 0) ? (sample.B08 - sample.B04) / val_ndvi : 0;
  
  let val_ndmi = sample.B08 + sample.B11;
  let ndmi = (val_ndmi !== 0) ? (sample.B08 - sample.B11) / val_ndmi : 0;

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

def fetch_block_statistics(token: str, block_geometry: dict, block_name: str, days_back: int = 365) -> list:
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)

    payload = {
        "input": {
            "bounds": {
                "geometry": block_geometry,
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
            "evalscript": EVALSCRIPT_VINEYARD
        }
    }

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"📡 Pobieranie {days_back} dni statystyk dla polygonu działki: {block_name}...")
    
    resp = requests.post(STATS_API_URL, json=payload, headers=headers)
    if resp.status_code != 200:
        print(f"⚠️ Błąd API CDSE dla {block_name}: {resp.text}")
        return []

    return resp.json().get("data", [])

def main():
    print("🚀 Start procesu Backfill (Poligony działek)...")
    if not all([SUPABASE_URL, SUPABASE_KEY, CLIENT_ID, CLIENT_SECRET]):
        print("❌ Przerwano: Brak poświadczeń CDSE lub Supabase w .env.local.")
        return

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Pobieramy poligony działek za pomocą RPC
    print("🗺️ Pobieranie danych GeoJSON działek z Supabase...")
    try:
        rpc_resp = supabase.rpc("get_vineyard_blocks_geojson", {}).execute()
        geojson_data = rpc_resp.data
    except Exception as e:
        print(f"❌ Błąd pobierania bloków z RPC: {e}")
        return

    if not geojson_data or 'features' not in geojson_data or not geojson_data['features']:
        print("⚠️ Brak działek (features) w bazie Supabase. Upewnij się, że migracja została zaaplikowana.")
        return

    features = geojson_data['features']
    token = get_cdse_token()
    records_to_upsert = []

    for feature in features:
        props = feature.get('properties', {})
        block_id = props.get('id')
        block_name = props.get('name', 'Nienazwana Parcela')
        geom = feature.get('geometry')

        if not block_id or not geom:
            continue

        stats = fetch_block_statistics(token, geom, block_name, days_back=365)
        
        for entry in stats:
            if 'outputs' not in entry: continue
            outputs = entry['outputs']
            
            ndvi_obj = outputs.get('ndvi', {}).get('bands', {}).get('B0')
            if not ndvi_obj or ndvi_obj.get('stats', {}).get('sampleCount', 0) == 0: continue
            
            ndmi_obj = outputs.get('ndmi', {}).get('bands', {}).get('B0')
            cloud_obj = outputs.get('cloud', {}).get('bands', {}).get('B0')

            ndvi_val = ndvi_obj['stats']['mean']
            ndmi_val = ndmi_obj['stats']['mean'] if ndmi_obj else 0.0
            cloud_pct = cloud_obj['stats']['mean'] * 100 if cloud_obj else 100
            date = entry['interval']['from'].split("T")[0]

            # Akceptujemy odczyty przy niskim zachmurzeniu (<= 40%)
            if cloud_pct <= 40:
                records_to_upsert.append({
                    "block_id": block_id,
                    "date": date,
                    "ndvi_mean": round(ndvi_val, 3),
                    "ndmi_mean": round(ndmi_val, 3),
                    "cloud_cover": round(cloud_pct, 1)
                })

    if records_to_upsert:
        print(f"💾 Wysyłanie {len(records_to_upsert)} przefiltrowanych odczytów dla działek do Supabase...")
        try:
            supabase.table("vineyard_stats").upsert(records_to_upsert, on_conflict="block_id, date").execute()
            print("✅ Backfill dla działek zakończony sukcesem!")
        except Exception as e:
            print(f"❌ Błąd zapisu statystyk: {e}")
    else:
        print("⚠️ Brak nowych bezchmurnych danych do zapisu.")

if __name__ == "__main__":
    main()
