export interface VineyardTimeSeries {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // -1 to 1
  ndmi_mean: number; // -1 to 1
  cloud_cover: number; // 0 to 100
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom?: any; // GeoJSON Polygon
  timeSeries: VineyardTimeSeries[];
}

export interface VineyardGeoJSONFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    id: string;
    name: string;
    area_ha: number;
    created_at?: string;
  };
}

export interface VineyardGeoJSON {
  type: 'FeatureCollection';
  features: VineyardGeoJSONFeature[];
}
