export interface VineyardBlockStats {
  date: string;        // YYYY-MM-DD
  ndvi_mean: number;   // -1.0 to 1.0 (mean NDVI)
  ndmi_mean: number;   // -1.0 to 1.0 (mean NDMI)
  cloud_cover: number; // 0 to 100
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any;           // GeoJSON Polygon geometry object (using any to avoid adding heavy GeoJSON dependencies)
  timeSeries?: VineyardBlockStats[];
}
