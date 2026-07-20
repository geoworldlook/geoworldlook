import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env.local
load_dotenv('.env.local')

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
CLIENT_ID = os.environ.get("COPERNICUS_CLIENT_ID")
CLIENT_SECRET = os.environ.get("COPERNICUS_CLIENT_SECRET")

if not all([SUPABASE_URL, SUPABASE_KEY, CLIENT_ID, CLIENT_SECRET]):
    raise ValueError("Critical Error: Missing required environment variables in .env.local")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
STATS_API_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics"

# Sentinel-2 Evalscript to calculate both NDVI and NDMI index values while tracking SCL cloud cover
EVALSCRIPT_S2 = """
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

  // SCL Classification: 3 (cloud shadow), 8, 9, 10 (clouds)
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
    print("🔑 Authenticating with CDSE...")
    payload = {"grant_type": "client_credentials", "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET}
    resp = requests.post(TOKEN_URL, data=payload)
    resp.raise_for_status()
    return resp.json()["access_token"]

def fetch_block_data(token: str, block_id: str, geom: dict, days_back: int = 365) -> list:
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)

    # Use the precise GeoJSON Polygon geometry directly for bounding requests
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
            "evalscript": EVALSCRIPT_S2
        }
    }

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"📡 Fetching {days_back} days of telemetry for Vineyard Block: {block_id}...")
    
    resp = requests.post(STATS_API_URL, json=payload, headers=headers)
    if resp.status_code != 200:
        print(f"⚠️ CDSE API error for block {block_id}: {resp.text}")
        return []

    return resp.json().get("data", [])

def main():
    print("🚀 Starting Copernicus Backfill process for Vineyard Polygons...")
    
    # Retrieve all blocks as GeoJSON FeatureCollection exclusively via RPC to avoid WKB format issues
    try:
        response = supabase.rpc("get_vineyard_blocks_geojson").execute()
        geojson_data = response.data
    except Exception as e:
        print(f"❌ Error invoking get_vineyard_blocks_geojson: {e}")
        return

    features = geojson_data.get("features", []) if geojson_data else []
    if not features:
        print("❌ No vineyard blocks found in Supabase.")
        return

    token = get_cdse_token()
    records_to_upsert = []

    for feature in features:
        block_id = feature["properties"]["id"]
        geom = feature["geometry"]
        block_name = feature["properties"].get("name", block_id)

        stats = fetch_block_data(token, block_id, geom, days_back=365)
        
        for entry in stats:
            if 'outputs' not in entry: continue
            outputs = entry['outputs']
            
            ndvi_obj = outputs.get('ndvi', {}).get('bands', {}).get('B0')
            ndmi_obj = outputs.get('ndmi', {}).get('bands', {}).get('B0')
            if not ndvi_obj or ndvi_obj.get('stats', {}).get('sampleCount', 0) == 0: continue
            if not ndmi_obj or ndmi_obj.get('stats', {}).get('sampleCount', 0) == 0: continue
            
            cloud_obj = outputs.get('cloud', {}).get('bands', {}).get('B0')
            ndvi_val = ndvi_obj['stats']['mean']
            ndmi_val = ndmi_obj['stats']['mean']
            cloud_pct = cloud_obj['stats']['mean'] * 100 if cloud_obj else 100
            date = entry['interval']['from'].split("T")[0]

            # We accept cloud cover up to 40%
            if cloud_pct <= 40:
                records_to_upsert.append({
                    "block_id": block_id,
                    "date": date,
                    "ndvi_mean": round(ndvi_val, 3),
                    "ndmi_mean": round(ndmi_val, 3),
                    "cloud_cover": round(cloud_pct, 1)
                })

    if records_to_upsert:
        print(f"💾 Sending {len(records_to_upsert)} cloudless telemetry records to Supabase...")
        try:
            supabase.table("vineyard_stats").upsert(records_to_upsert, on_conflict="block_id, date").execute()
            print("✅ Copernicus backfill process completed successfully!")
        except Exception as e:
            print(f"❌ Database write error: {e}")
    else:
        print("⚠️ No telemetry records found to write.")

if __name__ == "__main__":
    main()
