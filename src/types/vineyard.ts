export interface VineyardStats {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // 0.0 - 1.0
  ndmi_mean: number; // -1.0 - 1.0 (Normalized Difference Moisture Index)
  cloud_cover: number; // 0-100%
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom?: any; // GeoJSON Polygon object or geometry definition
  timeSeries: VineyardStats[];
}
