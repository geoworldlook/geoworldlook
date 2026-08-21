export interface Analysis {
  id: string
  title: string
  category: string
  date: string
  summary: string
  region: string
  status: 'active' | 'completed'
}

export interface SpatialPoint {
  id: string
  lat: number
  lng: number
  value: number
  title: string
}

export interface VineyardBlockProperties {
  id: string;
  name: string;
  area_ha: number;
  created_at?: string;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom?: any;
  coordinates?: number[][][]; // GeoJSON Polygon ring coordinates [lng, lat]
  created_at?: string;
  timeSeries?: VineyardStats[];
}

export interface VineyardStats {
  block_id?: string;
  date: string; // YYYY-MM-DD
  ndvi_mean: number;
  ndmi_mean: number;
  cloud_cover: number;
}

export interface VineyardFeature {
  type: 'Feature';
  id?: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  properties: VineyardBlockProperties;
}

export interface VineyardFeatureCollection {
  type: 'FeatureCollection';
  features: VineyardFeature[];
}
