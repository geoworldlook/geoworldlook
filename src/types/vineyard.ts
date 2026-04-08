
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
  // GeoJSON geometry will be handled as any for simplicity in this interface
  // but expected as Polygon from Supabase RPC
}

export interface VineyardBlockWithStats extends VineyardBlock {
  stats: VineyardStat[];
}
