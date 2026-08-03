export interface VineyardStats {
  block_id: string;
  date: string; // YYYY-MM-DD
  cloud_cover: number; // 0-100
  ndvi_mean: number; // -1 to 1
  ndmi_mean: number; // -1 to 1
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon geometry or direct geometry representation
  created_at?: string;
  timeSeries: VineyardStats[];
}
