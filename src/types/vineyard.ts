export interface VineyardStats {
  date: string; // YYYY-MM-DD
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon geometry object to accommodate without adding external GeoJSON type dependencies
  stats?: VineyardStats[];
}
