
import { createClient } from './server'
import { Analysis, SpatialPoint } from '@/types/database.types'

const MOCK_ANALYSES: Analysis[] = [
  {
    id: '1',
    title: 'Tatra Mountains Forest Dieback 2025',
    category: 'forest',
    date: '2026-02-20',
    summary: 'Sentinel-2 NDVI time series analysis detecting bark beetle-induced defoliation across 1,200 ha of Norway spruce stands in the Tatra National Park.',
    region: 'Tatra, PL',
    status: 'active'
  },
  {
    id: '2',
    title: 'Warsaw Urban Heat Island Mapping',
    category: 'urban',
    date: '2026-01-15',
    summary: 'Land Surface Temperature analysis using Landsat-8/9 thermal bands, quantifying urban heat island intensity across Warsaw metropolitan area.',
    region: 'Warsaw, PL',
    status: 'completed'
  },
  {
    id: '3',
    title: 'Biebrza Wetland Change Detection',
    category: 'sar',
    date: '2025-12-10',
    summary: 'Sentinel-1 SAR coherence analysis to monitor seasonal flooding dynamics and vegetation changes in Biebrza National Park.',
    region: 'Podlaskie, PL',
    status: 'completed'
  }
]

// Legacy Polish spatial points removed for code cleanup
const MOCK_SPATIAL_POINTS: SpatialPoint[] = []

export async function getAnalyses(): Promise<Analysis[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.warn('[GeoWorldLook] Supabase env vars missing — using mock data')
    return MOCK_ANALYSES
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('analyses')
      .select('id, title, category, date, summary, region, status')
      .order('date', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[GeoWorldLook] Supabase error:', error.message)
      return MOCK_ANALYSES
    }

    return data ?? MOCK_ANALYSES
  } catch (e) {
    console.error('[GeoWorldLook] Error initializing Supabase:', e)
    return MOCK_ANALYSES
  }
}

export async function getSpatialData(): Promise<SpatialPoint[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return MOCK_SPATIAL_POINTS
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('spatial_data')
      .select('id, lat, lng, value, title')
      .limit(200)

    if (error) {
      console.error('[GeoWorldLook] Supabase error:', error.message)
      return MOCK_SPATIAL_POINTS
    }

    return data ?? MOCK_SPATIAL_POINTS
  } catch (e) {
    console.error('[GeoWorldLook] Error initializing Supabase:', e)
    return MOCK_SPATIAL_POINTS
  }
}
