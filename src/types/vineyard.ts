
export interface VineyardTimeSeries {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // 0-1
  ndmi_mean: number; // -1 to 1
  cloud_cover: number; // 0-100
}

export interface VineyardBlockWithStats {
  id: string;
  name: string;
  area_ha: number | null;
  geom: any; // GeoJSON Polygon
  timeSeries: VineyardTimeSeries[];
}
