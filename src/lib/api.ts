import { supabase, checkSupabaseCredentials } from './supabase';
import { subDays } from 'date-fns';
import type { Station, SnowStat, AppData } from './data';

export const fetchAppData = async (): Promise<AppData> => {
  // This will throw an error if credentials are not set,
  // allowing the UI to catch it and display a helpful message.
  checkSupabaseCredentials();

  const ninetyDaysAgo = subDays(new Date(), 90).toISOString();

  // Pobieramy dane stacji i statystyki równolegle dla optymalizacji
  const stationsPromise = supabase
    .from('stations')
    .select('id, name, elevation:elevation_m')
    .in('id', ['zermatt', 'theodul', 'matterhorn']);

  const statsPromise = supabase
    .from('station_stats')
    .select('station_id, date, snow_index, cloud_cover')
    .gte('date', ninetyDaysAgo)
    .order('date', { ascending: true });

  const [stationsResult, statsResult] = await Promise.all([stationsPromise, statsPromise]);

  if (stationsResult.error) {
    console.error('Error fetching stations:', stationsResult.error);
    throw new Error('Could not fetch station data');
  }
  if (statsResult.error) {
    console.error('Error fetching stats:', statsResult.error);
    throw new Error('Could not fetch station stats');
  }
  
  // Sortujemy stacje, aby zachować spójność z UI
  const stationOrder = ['zermatt', 'theodul', 'matterhorn'];
  const stations: Station[] = (stationsResult.data || []).sort(
    (a, b) => stationOrder.indexOf(a.id) - stationOrder.indexOf(b.id)
  );

  // Grupujemy statystyki per stacja
  const stats: Record<Station['id'], SnowStat[]> = {
    zermatt: [],
    theodul: [],
    matterhorn: [],
  };

  for (const row of (statsResult.data || [])) {
    const stationId = row.station_id as Station['id'];
    if (stats[stationId]) {
      stats[stationId].push({
        date: row.date,
        // Mapujemy nazwy kolumn z bazy na nazwy używane w komponentach
        snowIndex: row.snow_index,
        cloudCover: row.cloud_cover,
      });
    }
  }

  return {
    stations,
    stats,
  };
};
