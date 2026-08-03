import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

# Załadowanie zmiennych z pliku .env.local lub .env
load_dotenv('.env.local')
load_dotenv('.env')

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
CLIENT_ID = os.environ.get("COPERNICUS_CLIENT_ID")
CLIENT_SECRET = os.environ.get("COPERNICUS_CLIENT_SECRET")

if not all([SUPABASE_URL, SUPABASE_KEY, CLIENT_ID, CLIENT_SECRET]):
    raise ValueError("Krytyczny błąd: Brak wymaganych zmiennych w .env.local")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
STATS_API_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics"

# Evalscript to calculate both NDVI and NDMI alongside Cloud classification
EVALSCRIPT = """
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

def fetch_block_stats(token: str, block: dict, days_back: int = 365) -> list:
    # Use exact polygon geometry from the GeoJSON
    geom = block.get('geom') or block.get('geometry')
    if not geom:
        print(f"⚠️ Brak geometrii dla działki: {block.get('name')}")
        return []

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
            "evalscript": EVALSCRIPT
        }
    }

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"📡 Pobieranie {days_back} dni telemetrii dla działki: {block['name']} ({block['area_ha']} ha)...")
    
    resp = requests.post(STATS_API_URL, json=payload, headers=headers)
    if resp.status_code != 200:
        print(f"⚠️ Błąd API CDSE dla {block['name']}: {resp.text}")
        return []

    return resp.json().get("data", [])

def main():
    print("🚀 Start procesu Backfill (Poligony Działek)...")
    
    # Retrieve all vineyard blocks utilizing our Database RPC (returns valid GeoJSON FeatureCollection)
    try:
        rpc_response = supabase.rpc("get_vineyard_blocks_geojson").execute()
        blocks_collection = rpc_response.data
    except Exception as e:
        print(f"❌ Błąd wywołania RPC get_vineyard_blocks_geojson: {e}")
        return

    if not blocks_collection or 'features' not in blocks_collection:
        print("❌ Brak działek w bazie Supabase lub błędny format GeoJSON.")
        return

    features = blocks_collection['features']
    if not features:
        print("❌ Brak zarejestrowanych działek winnicy w bazie.")
        return

    # Extract clean blocks from GeoJSON features
    blocks = []
    for f in features:
        props = f.get('properties', {})
        blocks.append({
            "id": props.get('id'),
            "name": props.get('name'),
            "area_ha": props.get('area_ha'),
            "geom": f.get('geometry')
        })

    token = get_cdse_token()
    records_to_upsert = []

    for block in blocks:
        stats = fetch_block_stats(token, block, days_back=365)
        
        for entry in stats:
            if 'outputs' not in entry: continue
            outputs = entry['outputs']
            
            # Extract NDVI stats
            ndvi_obj = outputs.get('ndvi', {}).get('bands', {}).get('B0')
            if not ndvi_obj or ndvi_obj.get('stats', {}).get('sampleCount', 0) == 0: continue
            
            # Extract NDMI stats
            ndmi_obj = outputs.get('ndmi', {}).get('bands', {}).get('B0')
            if not ndmi_obj or ndmi_obj.get('stats', {}).get('sampleCount', 0) == 0: continue

            cloud_obj = outputs.get('cloud', {}).get('bands', {}).get('B0')

            ndvi_val = ndvi_obj['stats']['mean']
            ndmi_val = ndmi_obj['stats']['mean']
            cloud_pct = cloud_obj['stats']['mean'] * 100 if cloud_obj else 100
            date = entry['interval']['from'].split("T")[0]

            # Accept only data with cloud cover <= 40%
            if cloud_pct <= 40:
                records_to_upsert.append({
                    "block_id": block['id'],
                    "date": date,
                    "ndvi_mean": round(ndvi_val, 3),
                    "ndmi_mean": round(ndmi_val, 3),
                    "cloud_cover": round(cloud_pct, 1)
                })

    if records_to_upsert:
        print(f"💾 Wysyłanie {len(records_to_upsert)} bezchmurnych odczytów indeksów do Supabase...")
        try:
            supabase.table("vineyard_stats").upsert(records_to_upsert, on_conflict="block_id, date").execute()
            print("✅ Backfill zakończony sukcesem!")
        except Exception as e:
            print(f"❌ Błąd zapisu statystyk: {e}")
    else:
        print("⚠️ Brak danych do zapisu.")

if __name__ == "__main__":
    main()
