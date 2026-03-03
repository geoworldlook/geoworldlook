
import { createClient } from './server'
import { Analysis, SpatialPoint } from '@/types/database.types'

/**
 * Fetches analysis portfolio items.
 * Returns mock data if Supabase environment variables are missing.
 */
export async function getAnalyses(): Promise<Analysis[]> {
  const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!hasEnv) {
    console.warn('Supabase credentials missing. Using mock analyses.')
    return [
      {
        id: 'urban-growth-2024',
        title: 'Post-Pandemic Urban Shift',
        category: 'Urban Planning',
        date: '2024-03-15',
        summary: 'Analyzing the geospatial migration patterns of workforce in major US tech hubs using cellular geolocation metadata.',
        region: 'United States',
        status: 'completed'
      },
      {
        id: 'amazon-deforestation',
        title: 'Real-time Deforestation Alerting',
        category: 'Environment',
        date: '2024-01-20',
        summary: 'Implementation of a localized change-detection algorithm using Sentinel-1 Radar data to bypass cloud cover.',
        region: 'Amazon Basin',
        status: 'active'
      },
      {
        id: 'coastal-erosion-risk',
        title: 'Sea Level Rise Risk Assessment',
        category: 'Climate Risk',
        date: '2023-11-05',
        summary: 'Bathy-LiDAR integrated modeling of coastal resilience along the Florida coastline for insurance risk profiling.',
        region: 'Florida, USA',
        status: 'completed'
      }
    ] as Analysis[]
  }

  try {
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
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e)
    return []
  }
}

/**
 * Fetches geospatial points for the map.
 * Returns mock data if Supabase environment variables are missing.
 */
export async function getSpatialData(): Promise<SpatialPoint[]> {
  const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!hasEnv) {
    console.warn('Supabase credentials missing. Using mock spatial data.')
    return [
      { id: '1', lat: 52.2297, lng: 21.0122, value: 0.85, title: 'Warsaw Development Hub' },
      { id: '2', lat: 48.8566, lng: 2.3522, value: 0.42, title: 'Paris Green Corridor' },
      { id: '3', lat: 51.5074, lng: -0.1278, value: 0.91, title: 'London Thermal Island' },
      { id: '4', lat: 40.7128, lng: -74.0060, value: 0.65, title: 'NYC Infrastructure Alert' },
      { id: '5', lat: 34.0522, lng: -118.2437, value: 0.33, title: 'LA Transit Expansion' },
      { id: '6', lat: -23.5505, lng: -46.6333, value: 0.77, title: 'São Paulo Urban Heat' },
      { id: '7', lat: 35.6762, lng: 139.6503, value: 0.88, title: 'Tokyo Density Matrix' },
      { id: '8', lat: 52.5200, lng: 13.4050, value: 0.55, title: 'Berlin Construction Node' }
    ] as SpatialPoint[]
  }

  try {
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
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e)
    return []
  }
}
