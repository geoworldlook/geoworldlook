export interface VineyardBlockStats {
  date: string; // YYYY-MM-DD
  ndvi_mean: number; // -1.0 to 1.0 (NDVI)
  ndmi_mean: number; // -1.0 to 1.0 (NDMI water stress)
  cloud_cover: number; // 0-100 (%)
}

export interface VineyardBlockProperties {
  id: string;
  name: string;
  area_ha: number;
}

export interface VineyardBlockGeoJSONFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // [ [ [lng, lat], ... ] ]
  };
  properties: VineyardBlockProperties;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  timeSeries: VineyardBlockStats[];
}
