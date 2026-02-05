import os
import random
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

# Załaduj zmienne z .env (musisz mieć tam SUPABASE_URL i KEY)
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Użyj Service Role do zapisu!

if not url or not key:
    raise ValueError("Brak kluczy Supabase w pliku .env")

supabase: Client = create_client(url, key)

STATIONS = ['zermatt', 'theodul', 'matterhorn']

def generate_mock_history(days=90):
    print(f"🚀 Rozpoczynam generowanie danych dla {len(STATIONS)} stacji...")
    
    data_payload = []
    today = datetime.now().date()

    for station in STATIONS:
        # Logika: Im wyżej (Theodul/Matterhorn), tym więcej śniegu
        base_snow = 0.8 if station != 'zermatt' else 0.2
        
        for i in range(days):
            date = today - timedelta(days=i)
            
            # Symulacja zmienności
            snow = max(0, min(1, base_snow + random.uniform(-0.1, 0.1)))
            cloud = max(0, min(100, random.uniform(0, 100))) # 0-100%
            
            data_payload.append({
                "station_id": station,
                "date": date.isoformat(),
                "snow_index": round(snow, 2),
                "cloud_cover": round(cloud, 1)
            })
    
    # Upsert (Wstaw lub zaktualizuj)
    print("📡 Wysyłanie danych do Supabase...")
    try:
        response = supabase.table('station_stats').upsert(data_payload).execute()
        print("✅ Sukces! Dane w bazie.")
    except Exception as e:
        print(f"❌ Błąd zapisu: {e}")

if __name__ == "__main__":
    generate_mock_history()