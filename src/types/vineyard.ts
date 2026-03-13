
export interface VineyardStat {
  block_id: string;
  date: string; // YYYY-MM-DD
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geometry: any; // GeoJSON Polygon
  stats: VineyardStat[];
}

export interface VineyardBlockWithStats extends VineyardBlock {
  stats: VineyardStat[];
}
