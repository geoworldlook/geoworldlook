
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

export interface VineyardBlockRecord {
  id: string;
  name: string;
  area_ha: number;
  geom: string; // WKB or GeoJSON from PostGIS
  created_at: string;
}

export interface VineyardStatRecord {
  block_id: string;
  date: string;
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}
