
export interface VineyardStat {
  date: string; // YYYY-MM-DD
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON geometry
}

export interface VineyardBlockWithStats extends VineyardBlock {
  stats: VineyardStat[];
}
