
export interface VineyardStat {
  block_id: string;
  date: string;
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  // GeoJSON features for MapLibre
  geometry?: any;
}

export interface VineyardBlockWithStats extends VineyardBlock {
  stats: VineyardStat[];
}
