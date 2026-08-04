export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // Using 'any' for the 'geom' field to accommodate GeoJSON Polygon objects without adding external GeoJSON type dependencies
}

export interface VineyardStat {
  block_id: string;
  date: string;
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number; // Normalized Difference Moisture Index for water stress evaluation
}
