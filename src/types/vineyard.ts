export interface VineyardTimeSeries {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // 0-1
  ndmi_mean: number; // -1 to 1 (moisture index)
  cloud_cover: number; // 0-100 %
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon Geometry or Feature
  timeSeries: VineyardTimeSeries[];
}
