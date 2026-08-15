export interface VineyardTimeSeries {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // 0.0 - 1.0
  ndmi_mean: number; // -1.0 - 1.0
  cloud_cover: number; // 0 - 100
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
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // [lng, lat][]
  };
  properties: VineyardBlockProperties;
}

export interface VineyardFeatureCollection {
  type: 'FeatureCollection';
  features: VineyardBlockFeature[];
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any;
  timeSeries?: VineyardTimeSeries[];
}
