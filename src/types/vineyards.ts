export interface VineyardTimeSeries {
  date: string;       // YYYY-MM-DD
  ndvi_mean: number;  // 0 to 1
  ndmi_mean: number;  // -1 to 1 (NDMI water stress indicator)
  cloud_cover: number; // 0 to 100
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON polygon geometry
  timeSeries?: VineyardTimeSeries[];
}
