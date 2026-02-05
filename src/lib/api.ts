import { supabase } from './supabase';
import { subDays, format } from 'date-fns';

export interface StationStat {
  station_id: string;
  date: string;
  snow_index: number;
  cloud_cover: number;
}

export interface ChartData {
  date: string;
  [key: string]: number | string;
}

export async function fetchDashboardData(): Promise<ChartData[]> {
  const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('station_stats')
    .select('date, station_id, snow_index')
    .in('station_id', ['zermatt', 'theodul', 'matterhorn'])
    .gte('date', ninetyDaysAgo)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Could not fetch dashboard data');
  }

  if (!data) {
    return [];
  }

  const formattedData = data.reduce((acc: { [key: string]: ChartData }, curr: StationStat) => {
    const { date, station_id, snow_index } = curr;
    if (!acc[date]) {
      acc[date] = { date };
    }
    acc[date][station_id] = snow_index;
    return acc;
  }, {});

  return Object.values(formattedData);
}
