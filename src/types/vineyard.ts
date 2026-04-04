
export interface VineyardStat {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // 0-1
  ndmi_mean: number; // -1 to 1
  cloud_cover: number; // 0-100
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface VineyardBlockWithStats extends VineyardBlock {
  stats: VineyardStat[];
}
