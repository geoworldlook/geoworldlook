
export interface VineyardStat {
  block_id: string;
  date: string; // YYYY-MM-DD
  cloud_cover: number; // 0-100
  ndvi_mean: number; // 0-1
  ndmi_mean: number; // 0-1
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon
}

export interface VineyardBlockWithStats extends VineyardBlock {
  stats: VineyardStat[];
}
