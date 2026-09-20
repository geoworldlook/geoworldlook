export interface VineyardTimeSeriesPoint {
  date: string; // YYYY-MM-DD
  cloud_cover: number; // 0-100%
  ndvi_mean: number; // -1 to 1
  ndmi_mean: number; // -1 to 1
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon Geometry or Feature
  timeSeries?: VineyardTimeSeriesPoint[];
}

export interface VineyardStat {
  block_id: string;
  date: string;
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}
