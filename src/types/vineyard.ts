export interface VineyardStat {
  date: string; // YYYY-MM-DD
  ndvi_mean: number;
  ndmi_mean: number;
  cloud_cover: number;
}

export interface VineyardBlockProperties {
  id: string;
  name: string;
  area_ha: number;
}

export interface VineyardBlockFeature {
  type: 'Feature';
  id?: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: VineyardBlockProperties;
}

export interface VineyardBlockGeoJSON {
  type: 'FeatureCollection';
  features: VineyardBlockFeature[];
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom?: any;
  timeSeries?: VineyardStat[];
}
