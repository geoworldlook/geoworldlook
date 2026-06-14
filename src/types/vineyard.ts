
export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon
  created_at: string;
}

export interface VineyardStat {
  block_id: string;
  date: string; // YYYY-MM-DD
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

export interface VineyardBlockWithStats extends VineyardBlock {
  stats: VineyardStat[];
}
