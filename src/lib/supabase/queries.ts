
import { createClient } from './server'
import { Analysis } from '@/types/database.types'
import { VineyardBlock } from '@/types/vineyard'
import { MOCK_VINEYARD_BLOCKS } from '../mock-data/vineyard'

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

    return (data as Analysis[]) ?? MOCK_ANALYSES
  } catch (e) {
    console.error('[GeoWorldLook] Error initializing Supabase:', e)
    return MOCK_ANALYSES
  }
}

export async function getVineyardBlocks(): Promise<VineyardBlock[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return MOCK_VINEYARD_BLOCKS
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson')

    if (error) {
      console.error('[GeoWorldLook] Supabase RPC error:', error.message)

      // Fallback to direct select
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('vineyard_blocks')
        .select('id, name, area_ha, geom')
        .limit(200)

      if (fallbackError) return MOCK_VINEYARD_BLOCKS
      return (fallbackData as VineyardBlock[])
    }

    return (data as VineyardBlock[]) ?? MOCK_VINEYARD_BLOCKS
  } catch (e) {
    console.error('[GeoWorldLook] Error initializing Supabase:', e)
    return MOCK_VINEYARD_BLOCKS
  }
}
