
export interface VineyardStat {
  date: string; // YYYY-MM-DD
  cloud_cover: number; // 0-100
  ndvi_mean: number; // 0-1
  ndmi_mean: number; // -1 to 1 (Water stress index)
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
