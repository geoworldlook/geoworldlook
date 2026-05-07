
export interface VineyardStat {
  date: string;
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon
  created_at?: string;
}

export interface VineyardBlockWithStats extends VineyardBlock {
  stats: VineyardStat[];
}
