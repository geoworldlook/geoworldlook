
export interface VineyardStat {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // 0-1
  ndmi_mean: number; // -1 to 1 (water stress)
  cloud_cover: number; // 0-100
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon
  created_at: string;
}

export interface VineyardBlockWithStats extends VineyardBlock {
  stats: VineyardStat[];
}
