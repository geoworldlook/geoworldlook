import { createClient } from './server'
import { Analysis, SpatialPoint, VineyardBlockWithStats } from '@/types/database.types'

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
  },
  {
    id: '4',
    title: 'Mazovia Agricultural Monitoring',
    category: 'agriculture',
    date: '2025-11-05',
    summary: 'Multi-temporal crop classification using Sentinel-2 spectral indices (NDVI, EVI, NDWI) for agricultural field segmentation and yield estimation.',
    region: 'Mazovia, PL',
    status: 'active'
  },
  {
    id: '5',
    title: 'Tri-City Coastal Erosion Monitoring',
    category: 'sar',
    date: '2025-10-20',
    summary: 'SAR backscatter time series analysis detecting shoreline changes and coastal erosion along the Baltic Sea coast near Gdańsk.',
    region: 'Pomerania, PL',
    status: 'active'
  },
  {
    id: '6',
    title: 'Kraków Air Quality & LULC Correlation',
    category: 'urban',
    date: '2025-09-30',
    summary: 'Land Use/Land Cover change analysis correlated with air quality station data to identify pollution source areas.',
    region: 'Kraków, PL',
    status: 'completed'
  }
]

const MOCK_SPATIAL_POINTS: SpatialPoint[] = [
  { id: '1', lat: 49.23, lng: 19.98, value: 0.82, title: 'Tatra — Forest Stress Zone A' },
  { id: '2', lat: 49.31, lng: 20.07, value: 0.65, title: 'Tatra — Forest Stress Zone B' },
  { id: '3', lat: 49.18, lng: 19.91, value: 0.45, title: 'Tatra — Moderate Defoliation' },
  { id: '4', lat: 52.23, lng: 21.01, value: 0.71, title: 'Warsaw — Heat Island Core' },
  { id: '5', lat: 52.18, lng: 20.95, value: 0.55, title: 'Warsaw — Suburban Buffer' },
  { id: '6', lat: 53.41, lng: 22.83, value: 0.38, title: 'Biebrza — Flood Zone' },
  { id: '7', lat: 53.35, lng: 22.75, value: 0.29, title: 'Biebrza — Wetland Core' },
  { id: '8', lat: 52.35, lng: 20.88, value: 0.60, title: 'Mazovia — Agricultural Field 1' },
  { id: '9', lat: 52.41, lng: 21.15, value: 0.72, title: 'Mazovia — Agricultural Field 2' },
  { id: '10', lat: 54.35, lng: 18.65, value: 0.44, title: 'Gdańsk — Coastal Erosion Zone' },
  { id: '11', lat: 54.41, lng: 18.55, value: 0.51, title: 'Gdynia — Shoreline Change' },
  { id: '12', lat: 50.06, lng: 19.94, value: 0.68, title: 'Kraków — LULC Change Zone' }
]

const MOCK_VINEYARD_BLOCKS: VineyardBlockWithStats[] = [
  {
    id: 'b1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [10.12, 44.55],
        [10.13, 44.55],
        [10.13, 44.56],
        [10.12, 44.56],
        [10.12, 44.55]
      ]]
    },
    created_at: new Date().toISOString(),
    latest_stats: {
      block_id: 'b1',
      date: '2024-05-15',
      cloud_cover: 0.1,
      ndvi_mean: 0.75,
      ndmi_mean: 0.12
    }
  },
  {
    id: 'b2',
    name: 'Parcela South Sangiovese',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [10.14, 44.54],
        [10.15, 44.54],
        [10.15, 44.55],
        [10.14, 44.55],
        [10.14, 44.54]
      ]]
    },
    created_at: new Date().toISOString(),
    latest_stats: {
      block_id: 'b2',
      date: '2024-05-15',
      cloud_cover: 0.1,
      ndvi_mean: 0.62,
      ndmi_mean: 0.08
    }
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
    console.warn('[GeoWorldLook] Supabase env vars missing — using mock data')
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

export async function getVineyardBlocks(): Promise<VineyardBlockWithStats[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.warn('[GeoWorldLook] Supabase env vars missing — using mock data')
    return MOCK_VINEYARD_BLOCKS
  }

  try {
    const supabase = await createClient()

    // Using RPC to get blocks with GeoJSON and latest stats
    const { data, error } = await supabase.rpc('get_blocks_with_stats')

    if (error) {
      console.error('[GeoWorldLook] Supabase error:', error.message)
      return MOCK_VINEYARD_BLOCKS
    }

    return data ?? MOCK_VINEYARD_BLOCKS
  } catch (e) {
    console.error('[GeoWorldLook] Error initializing Supabase:', e)
    return MOCK_VINEYARD_BLOCKS
  }
}
