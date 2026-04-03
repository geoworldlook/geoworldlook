
export interface VineyardStat {
  block_id: string;
  date: string;
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  // Standard properties for the component
  stats?: VineyardStat[];
}

export interface VineyardBlockFeature {
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
  };
}

export interface VineyardBlockCollection {
  type: 'FeatureCollection';
  features: VineyardBlockFeature[];
}
