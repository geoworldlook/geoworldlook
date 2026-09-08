export interface VineyardStat {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // 0-1
  ndmi_mean: number; // -1 to 1 (Moisture index)
  cloud_cover: number; // 0-100
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon object or GeoJSON Geometry
  stats?: VineyardStat[];
}

export interface VineyardBlockGeoJSONFeature {
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

export interface VineyardBlockGeoJSONCollection {
  type: 'FeatureCollection';
  features: VineyardBlockGeoJSONFeature[];
}
