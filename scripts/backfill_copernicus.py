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
    print("⚠️ Uwaga: Brak zmiennych środowiskowych. Skrypt może nie działać w trybie produkcyjnym.")

def get_supabase_client():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    return create_client(SUPABASE_URL, SUPABASE_KEY)

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
STATS_API_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics"

# Evalscript obliczający NDVI i NDMI
INDEX_EVALSCRIPT = """
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
  // NDVI = (NIR - Red) / (NIR + Red) -> (B08 - B04) / (B08 + B04)
  let ndvi = (sample.B08 + sample.B04 !== 0) ? (sample.B08 - sample.B04) / (sample.B08 + sample.B04) : 0;

  // NDMI = (NIR - SWIR) / (NIR + SWIR) -> (B08 - B11) / (B08 + B11)
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

def fetch_block_stats(token: str, block: dict, days_back: int = 365) -> list:
    # Używamy geometrii poligonu zamiast BBOX
    geom = block['geom']
    if isinstance(geom, str):
        geom = json.loads(geom)

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
            "evalscript": INDEX_EVALSCRIPT
        }
    }

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"📡 Pobieranie {days_back} dni danych dla działki: {block['name']}...")
    
    resp = requests.post(STATS_API_URL, json=payload, headers=headers)
    if resp.status_code != 200:
        print(f"⚠️ Błąd API CDSE dla {block['name']}: {resp.text}")
        return []

    return resp.json().get("data", [])

def main():
    print("🚀 Start procesu Backfill dla Poligonów...")
    
    supabase = get_supabase_client()
    if not supabase:
        print("❌ Brak klienta Supabase. Przerwanie.")
        return

    # Pobieramy działki (wymaga pobrania geometrii w formacie GeoJSON lub WKT, Supabase domyślnie zwraca GeoJSON dla PostGIS)
    blocks = supabase.table("vineyard_blocks").select("id, name, geom").execute().data
    if not blocks:
        print("❌ Brak działek w bazie Supabase.")
        return

    token = get_cdse_token()
    records_to_upsert = []

    for block in blocks:
        stats = fetch_block_stats(token, block, days_back=365)
        
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
                    "block_id": block['id'],
                    "date": date,
                    "ndvi_mean": round(ndvi_val, 3),
                    "ndmi_mean": round(ndmi_val, 3),
                    "cloud_cover": round(cloud_pct, 1)
                })

    if records_to_upsert:
        print(f"💾 Wysyłanie {len(records_to_upsert)} odczytów do tabeli vineyard_stats...")
        try:
            supabase.table("vineyard_stats").upsert(records_to_upsert, on_conflict="block_id, date").execute()
            print("✅ Backfill zakończony sukcesem!")
        except Exception as e:
            print(f"❌ Błąd zapisu: {e}")
    else:
        print("⚠️ Brak danych do zapisu.")

if __name__ == "__main__":
    main()
