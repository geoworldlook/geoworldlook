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

# Evalscript z wyliczaniem NDVI oraz NDMI (Normalized Difference Moisture Index)
SATELLITE_EVALSCRIPT = """
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
  // NDVI = (B08 - B04) / (B08 + B04)
  let val_ndvi = sample.B08 + sample.B04;
  let ndvi = (val_ndvi !== 0) ? (sample.B08 - sample.B04) / val_ndvi : 0;

  // NDMI = (B08 - B11) / (B08 + B11) do oceny stresu wodnego
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

def get_bounds_from_feature(feature: dict) -> dict:
    geometry = feature.get("geometry")
    if geometry and isinstance(geometry, dict) and "coordinates" in geometry:
        return {
            "geometry": geometry,
            "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
        }

    # Fallback BBox calculation if coords exists in different format
    coords = geometry.get("coordinates", []) if geometry else []
    if coords and len(coords) > 0:
        flat_coords = coords[0] if isinstance(coords[0][0], list) else coords
        lngs = [c[0] for c in flat_coords]
        lats = [c[1] for c in flat_coords]
        bbox = [min(lngs), min(lats), max(lngs), max(lats)]
        return {
            "bbox": bbox,
            "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
        }

    raise ValueError(f"Nieprawidłowa geometria poligonu dla działki ID: {feature.get('id')}")

def fetch_block_data(token: str, block_feature: dict, days_back: int = 365) -> list:
    block_id = block_feature.get("id") or block_feature.get("properties", {}).get("id")
    block_name = block_feature.get("properties", {}).get("name", block_id)
    bounds = get_bounds_from_feature(block_feature)
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)

    payload = {
        "input": {
            "bounds": bounds,
            "data": [{"type": "sentinel-2-l2a"}]
        },
        "aggregation": {
            "timeRange": {
                "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                "to": end_date.strftime("%Y-%m-%dT23:59:59Z")
            },
            "aggregationInterval": {"of": "P1D"},
            "evalscript": SATELLITE_EVALSCRIPT
        }
    }

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"📡 Pobieranie telemetrycznych danych teledetekcyjnych dla działki: {block_name}...")
    
    resp = requests.post(STATS_API_URL, json=payload, headers=headers)
    if resp.status_code != 200:
        print(f"⚠️ Błąd API CDSE dla {block_name}: {resp.text}")
        return []

    return resp.json().get("data", [])

def main():
    print("🚀 Start procesu Backfill dla działek winnicy (vineyard_blocks)...")
    
    # Pobieramy działki winnicy w formacie GeoJSON z funkcji RPC lub tabeli
    try:
        rpc_resp = supabase.rpc("get_vineyard_blocks_geojson").execute()
        geojson_data = rpc_resp.data if rpc_resp.data else {}
        features = geojson_data.get("features", [])
    except Exception as err:
        print(f"⚠️ Nie można pobrać przez RPC get_vineyard_blocks_geojson: {err}")
        features = []

    if not features:
        print("⚠️ Próba pobrania bezpośrednio z tabeli vineyard_blocks...")
        blocks_data = supabase.table("vineyard_blocks").select("id, name, area_ha").execute().data
        if not blocks_data:
            print("❌ Brak działek winnicy w bazie Supabase.")
            return
        # Konwersja na strukturę feature
        features = [{
            "id": b["id"],
            "properties": {"id": b["id"], "name": b["name"], "area_ha": b.get("area_ha")},
            "geometry": None
        } for b in blocks_data]

    token = get_cdse_token()
    records_to_upsert = []

    for feature in features:
        block_id = feature.get("id") or feature.get("properties", {}).get("id")
        stats = fetch_block_data(token, feature, days_back=365)
        
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

            # Akceptujemy tylko dane o zachmurzeniu <= 40%
            if cloud_pct <= 40:
                records_to_upsert.append({
                    "block_id": block_id,
                    "date": date,
                    "ndvi_mean": round(ndvi_val, 3),
                    "ndmi_mean": round(ndmi_val, 3),
                    "cloud_cover": round(cloud_pct, 1)
                })

    if records_to_upsert:
        print(f"💾 Wysyłanie {len(records_to_upsert)} bezchmurnych odczytów do tabeli vineyard_stats...")
        try:
            supabase.table("vineyard_stats").upsert(records_to_upsert, on_conflict="block_id, date").execute()
            print("✅ Backfill zakończony sukcesem!")
        except Exception as e:
            print(f"❌ Błąd zapisu: {e}")
    else:
        print("⚠️ Brak danych do zapisu.")

if __name__ == "__main__":
    main()
