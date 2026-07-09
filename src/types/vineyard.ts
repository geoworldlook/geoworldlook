
export interface VineyardStats {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // 0-1
  ndmi_mean: number; // -1 to 1
  cloud_cover: number; // 0-100
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon
  stats: VineyardStats[];
}

export interface VineyardBlockGeoJSON {
  type: 'FeatureCollection';
  features: {
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
  }[];
}
