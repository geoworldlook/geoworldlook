export interface VineyardStats {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // 0-1
  ndmi_mean: number; // -1 to 1 (usually NDMI)
  cloud_cover: number; // 0-100
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON geometry (Polygon)
  created_at?: string;
  timeSeries?: VineyardStats[];
}
