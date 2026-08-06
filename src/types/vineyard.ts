export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number | null;
  geom: any; // GeoJSON polygon
}

export interface VineyardBlockStats {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // Mean NDVI
  ndmi_mean: number; // Mean NDMI
  cloud_cover: number; // Percentage (0-100)
}
