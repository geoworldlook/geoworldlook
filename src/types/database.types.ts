
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

export interface VineyardBlock {
  id: string
  name: string
  area_ha: number
  geom: any // GeoJSON Polygon
  created_at: string
}

export interface VineyardStat {
  block_id: string
  date: string
  cloud_cover: number
  ndvi_mean: number
  ndmi_mean: number
}

export interface VineyardBlockWithStats extends VineyardBlock {
  latest_stats?: VineyardStat
}
