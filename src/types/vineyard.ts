export interface VineyardStat {
  date: string; // YYYY-MM-DD
  cloud_cover: number; // 0-100 (%)
  ndvi_mean: number; // -1 to 1 (mean vegetation index)
  ndmi_mean: number; // -1 to 1 (mean moisture index)
}

export interface VineyardBlockProperties {
  id: string;
  name: string;
  area_ha: number;
  created_at?: string;
}

export interface VineyardBlockGeoJSONFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  properties: VineyardBlockProperties;
}

export interface VineyardBlockFeatureCollection {
  type: 'FeatureCollection';
  features: VineyardBlockGeoJSONFeature[];
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any;
  timeSeries?: VineyardStat[];
}
