
import { createClient } from './server'
import { Analysis, SpatialPoint } from '@/types/database.types'

export async function getAnalyses(): Promise<Analysis[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('analyses')
    .select('id, title, category, date, summary, region, status')
    .order('date', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching analyses:', error)
    return []
  }

  return data as Analysis[]
}

export async function getSpatialData(): Promise<SpatialPoint[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('spatial_data')
    .select('id, lat, lng, value, title')
    .limit(200)

  if (error) {
    console.error('Error fetching spatial data:', error)
    return []
  }

  return data as SpatialPoint[]
}
