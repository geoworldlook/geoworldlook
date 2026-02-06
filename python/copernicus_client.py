import os
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Lokalnie w IDX załaduje .env. Na GitHubie po prostu pominie.
if os.path.exists('.env'):
    load_dotenv()

# Pobieranie zmiennych
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
CLIENT_ID = os.environ.get("COPERNICUS_CLIENT_ID")
CLIENT_SECRET = os.environ.get("COPERNICUS_CLIENT_SECRET")

# Prosty check bez przerywania, jeśli zmienne są w systemie
if not all([SUPABASE_URL, SUPABASE_KEY, CLIENT_ID, CLIENT_SECRET]):
    print("❌ BŁĄD: Brakuje kluczy w środowisku!")
    # Wyświetli co jest puste (ułatwia debugowanie)
    print(f"URL: {bool(SUPABASE_URL)}, KEY: {bool(SUPABASE_KEY)}, ID: {bool(CLIENT_ID)}, SEC: {bool(CLIENT_SECRET)}")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# 3. Logika sprawdzająca (Zastępuje Twój stary błąd w linii 20)
missing_vars = []
if not SUPABASE_URL: missing_vars.append("SUPABASE_URL")
if not SUPABASE_KEY: missing_vars.append("SUPABASE_SERVICE_ROLE_KEY")
if not CLIENT_ID: missing_vars.append("COPERNICUS_CLIENT_ID")
if not CLIENT_SECRET: missing_vars.append("COPERNICUS_CLIENT_SECRET")

if missing_vars:
    print(f"❌ BŁĄD KONFIGURACJI: Brakujące zmienne: {', '.join(missing_vars)}")
    # Na GitHubie to wypisze dokładnie czego brakuje w 'Secrets'
    raise ValueError("Brak wymaganych zmiennych środowiskowych.")

# Inicjalizacja klienta
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
STATS_API_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics"

if not all([SUPABASE_URL, SUPABASE_KEY, CLIENT_ID, CLIENT_SECRET]):
    raise ValueError("❌ Brak kluczy w .env!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- EVALSCRIPT (To jest serce GIS - liczy NDSI w chmurze) ---
NDSI_EVALSCRIPT = """
//VERSION=3
function setup() {
  return {
    input: ["B03", "B11", "SCL"],
    output: [
      { id: "default", bands: 1 },
      { id: "cloud", bands: 1 },
      { id: "dataMask", bands: 1 } // <--- WYMAGANE PRZEZ API
    ]
  };
}

function evaluatePixel(sample) {
  // NDSI = (Green - SWIR) / (Green + SWIR)
  let val = (sample.B03 + sample.B11);
  let ndsi = (val != 0) ? (sample.B03 - sample.B11) / val : 0;
  
  // Detekcja chmur (3=Shadow, 8-10=Cloud)
  let isCloud = [3, 8, 9, 10].includes(sample.SCL) ? 1 : 0;
  
  // Maska danych: 1 = dane poprawne, 0 = brak danych (np. ramka zdjęcia)
  // SCL 0 to zazwyczaj NO_DATA
  let isValid = (sample.SCL !== 0) ? 1 : 0;
  
  return {
    default: [ndsi],
    cloud: [isCloud],
    dataMask: [isValid] // <--- ZWRACAMY MASKĘ
  };
}
"""

def get_access_token():
    payload = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    resp = requests.post(TOKEN_URL, data=payload)
    resp.raise_for_status()
    return resp.json()["access_token"]

def fetch_stats_for_station(token, station, days=30):
    # Tworzymy mały bufor (polygon) wokół punktu stacji (bbox ~100m)
    lat, lng = station['lat'], station['lng']
    offset = 0.001 # ok 100m
    bbox = [lng - offset, lat - offset, lng + offset, lat + offset]
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    payload = {
        "input": {
            "bounds": {
                "bbox": bbox,
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
            },
            "data": [{"type": "sentinel-2-l2a"}]
        },
        "aggregation": {
            "timeRange": {
                "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                "to": end_date.strftime("%Y-%m-%dT23:59:59Z")
            },
            "aggregationInterval": {"of": "P1D"}, # 1 dzień
            "evalscript": NDSI_EVALSCRIPT
        }
    }

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print(f"📡 Pobieranie danych dla: {station['name']}...")
    resp = requests.post(STATS_API_URL, json=payload, headers=headers)
    
    if resp.status_code != 200:
        print(f"⚠️ Błąd API: {resp.text}")
        return []

    return resp.json().get("data", [])

def main():
    print("🚀 Start Sentinel-2 Pipeline")
    
    # 1. Pobierz stacje z bazy
    stations = supabase.table("stations").select("*").execute().data
    print(f"Znaleziono {len(stations)} stacji.")
    
    # 2. Zaloguj się do Copernicusa
    token = get_access_token()
    
    records_to_upsert = []

    # 3. Pętla po stacjach
    for station in stations:
        stats = fetch_stats_for_station(token, station)
        
        for entry in stats:
            # Sprawdź czy odpowiedź jest kompletna
            if 'outputs' not in entry or 'default' not in entry['outputs']:
                continue
            
            # --- POPRAWKA TUTAJ ---
            # API zwraca klucz "B0" dla pasma, a nie "0"
            default_bands = entry['outputs']['default']['bands']
            cloud_bands = entry['outputs']['cloud']['bands']
            
            # Pobieramy statystyki bezpiecznie (szukamy 'B0', a jak nie ma to '0')
            ndsi_stat = default_bands.get('B0') or default_bands.get('0')
            cloud_stat = cloud_bands.get('B0') or cloud_bands.get('0')

            if not ndsi_stat or not cloud_stat:
                continue

            ndsi = ndsi_stat['stats']['mean']
            cloud_pct = cloud_stat['stats']['mean'] * 100
            date = entry['interval']['from'].split("T")[0]

            # Ignorujemy błędne odczyty (NaN)
            if ndsi is None: 
                continue 

            records_to_upsert.append({
                "station_id": station['id'],
                "date": date,
                "snow_index": round(ndsi, 3),
                "cloud_cover": round(cloud_pct, 1)
            })

    # 4. Zapisz do bazy
    if records_to_upsert:
        print(f"💾 Zapisywanie {len(records_to_upsert)} rekordów do Supabase...")
        supabase.table("station_stats").upsert(records_to_upsert, on_conflict="station_id, date").execute()
        print("✅ Gotowe!")
    else:
        print("⚠️ Brak nowych danych.")

if __name__ == "__main__":
    main()