export interface VineyardStats {
  date: string; // YYYY-MM-DD
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

export interface VineyardBlockProperties {
  id: string;
  name: string;
  area_ha: number;
  created_at?: string;
}

export interface VineyardBlock {
  type: 'Feature';
  id: string;
  geometry: any; // GeoJSON geometry
  properties: VineyardBlockProperties;
  timeSeries?: VineyardStats[];
}
