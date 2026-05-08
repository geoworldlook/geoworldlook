
export interface VineyardStat {
  date: string;
  ndvi_mean: number;
  ndmi_mean: number;
  cloud_cover: number;
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
