export interface VineyardBlockStats {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // -1.000 to 1.000
  ndmi_mean: number; // -1.000 to 1.000
  cloud_cover: number; // 0.00 to 100.00
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon object to support dynamic polygons without external type dependencies
  timeSeries?: VineyardBlockStats[];
}
