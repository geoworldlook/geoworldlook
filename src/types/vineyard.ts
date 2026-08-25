export interface VineyardStats {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // -1 to 1
  ndmi_mean: number; // -1 to 1 (Normalized Difference Moisture Index)
  cloud_cover: number; // 0-100
}

export interface VineyardBlockProperties {
  id: string;
  name: string;
  area_ha: number;
  created_at?: string;
}

export interface VineyardBlockFeature {
  type: 'Feature';
  id: string;
  geometry: any;
  properties: VineyardBlockProperties;
}

export interface VineyardBlockCollection {
  type: 'FeatureCollection';
  features: VineyardBlockFeature[];
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON geometry or raw geometry object
  timeSeries?: VineyardStats[];
}
