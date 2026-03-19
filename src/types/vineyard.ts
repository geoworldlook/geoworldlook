export interface VineyardStat {
  date: string; // YYYY-MM-DD
  ndvi_mean: number;
  ndmi_mean: number;
  cloud_cover: number;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  // GeoJSON properties
}

export interface VineyardBlockWithStats extends VineyardBlock {
  stats: VineyardStat[];
}

export interface VineyardGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
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
  }>;
}
