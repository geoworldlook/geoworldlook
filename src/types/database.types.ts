
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

export interface VineyardBlockDB {
  id: string
  name: string
  area_ha: number
  geom: any
  created_at: string
}

export interface VineyardStatDB {
  block_id: string
  date: string
  cloud_cover: number
  ndvi_mean: number
  ndmi_mean: number
}
