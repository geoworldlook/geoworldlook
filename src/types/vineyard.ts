export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon geometry
}

export interface VineyardStats {
  date: string;
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}
