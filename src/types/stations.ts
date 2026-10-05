export interface VineyardStats {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // 0-1
  ndmi_mean: number; // -1 to 1 (Normalized Difference Moisture Index)
  cloud_cover: number; // 0-100
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: {
    type: 'Polygon';
    coordinates: number[][][]; // [lng, lat][]
  };
  timeSeries: VineyardStats[];
}

// Backward compatibility aliases
export type StationTimeSeries = VineyardStats;
export interface Station {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number];
  timeSeries: StationTimeSeries[];
}
