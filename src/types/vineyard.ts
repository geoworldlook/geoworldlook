
export interface VineyardStats {
  date: string;
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON geometry
  stats: VineyardStats[];
}
