
/**
 * @deprecated Use VineyardBlock and VineyardStat from '@/types/vineyard' instead.
 * This file is kept for backward compatibility during the transition from point-based stations to polygon-based blocks.
 */

export interface StationTimeSeries {
  date: string; // YYYY-MM-DD
  ndvi_index: number; // 0-1
  cloud_cover: number; // 0-100
}

export interface Station {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number]; // [lng, lat]
  timeSeries: StationTimeSeries[];
}
