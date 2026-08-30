export interface VineyardBlockTimeSeries {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // 0-1
  ndmi_mean: number; // -1 to 1 (water stress index)
  cloud_cover: number; // 0-100
}

export interface VineyardBlockData {
  id: string;
  name: string;
  area_ha: number;
  coordinates: [number, number][][]; // Polygon coordinates array [[[lng, lat], ...]]
  timeSeries: VineyardBlockTimeSeries[];
}

// Retaining legacy aliases for backward compatibility if needed
export type StationTimeSeries = VineyardBlockTimeSeries;
export type Station = VineyardBlockData;
