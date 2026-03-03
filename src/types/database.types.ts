
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
