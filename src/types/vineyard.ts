export interface VineyardTimeSeries {
  date: string; // YYYY-MM-DD
  ndvi_mean: number;
  ndmi_mean: number;
  cloud_cover: number;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon object
  timeSeries: VineyardTimeSeries[];
}
