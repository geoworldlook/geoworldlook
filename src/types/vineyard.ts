export interface VineyardStat {
  date: string; // YYYY-MM-DD
  cloud_cover: number; // 0-100
  ndvi_mean: number; // 0-1
  ndmi_mean: number; // -1 to 1 (water stress moisture index)
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon object (e.g., { type: 'Polygon', coordinates: [...] })
  timeSeries?: VineyardStat[];
}
