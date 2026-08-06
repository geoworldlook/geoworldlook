'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VineyardBlock, VineyardBlockStats } from '@/types/vineyard'

// Mock GeoJSON Polygons in Zielona Góra, Poland region
const MOCK_BLOCKS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'block-pl-01',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.500, 51.930],
            [15.510, 51.930],
            [15.510, 51.935],
            [15.500, 51.935],
            [15.500, 51.930]
          ]
        ]
      },
      properties: {
        id: 'block-pl-01',
        name: 'Zielona Góra - Parcela Północna',
        area_ha: 4.5
      }
    },
    {
      type: 'Feature',
      id: 'block-pl-02',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.515, 51.932],
            [15.525, 51.932],
            [15.525, 51.937],
            [15.515, 51.937],
            [15.515, 51.932]
          ]
        ]
      },
      properties: {
        id: 'block-pl-02',
        name: 'Zielona Góra - Parcela Południowa',
        area_ha: 6.2
      }
    }
  ]
}

// Generate realistic mock telemetry (NDVI & NDMI) for fallback/local development
function generateMockStats(blockId: string): VineyardBlockStats[] {
  const stats: VineyardBlockStats[] = []
  const start = new Date('2025-01-01')

  for (let i = 0; i < 24; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i * 14) // Bi-weekly data

    // Seasonal NDVI curve
    const month = d.getMonth()
    let ndviBase = 0.2
    if (month >= 3 && month <= 5) ndviBase = 0.3 + (month - 3) * 0.15 // Spring growth
    else if (month >= 6 && month <= 7) ndviBase = 0.75 + Math.random() * 0.08 // Peak summer
    else if (month >= 8 && month <= 9) ndviBase = 0.65 - (month - 8) * 0.15 // Harvest/autumn drop
    else ndviBase = 0.2 + Math.random() * 0.05 // Winter dormant

    // NDMI moisture curve (correlated with NDVI but with some variations representing rain/dry spells)
    let ndmiBase = ndviBase * 0.7 - 0.1
    if (month === 6 || month === 7) ndmiBase -= 0.15 // Peak heat dryness stress

    stats.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(Math.max(0.1, Math.min(1.0, ndviBase)).toFixed(3)),
      ndmi_mean: parseFloat(Math.max(-1.0, Math.min(1.0, ndmiBase)).toFixed(3)),
      cloud_cover: parseFloat((Math.random() * 15).toFixed(1))
    })
  }
  return stats
}

export function useVineyardData() {
  const [blocks, setBlocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchBlocks() {
      // Check if Supabase keys exist in env
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('[GeoWorldLook] Supabase env variables missing. Falling back to local Polish vineyard block mock data.')
        setBlocks(MOCK_BLOCKS_GEOJSON.features)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson')
        if (error) throw error

        if (data && data.features) {
          setBlocks(data.features)
        } else {
          setBlocks([])
        }
      } catch (err: any) {
        console.error('[GeoWorldLook] Error fetching vineyard blocks geojson:', err.message)
        setError(err.message)
        // Fallback in case of database or network errors
        setBlocks(MOCK_BLOCKS_GEOJSON.features)
      } finally {
        setLoading(false)
      }
    }

    fetchBlocks()
  }, [])

  async function getBlockStats(blockId: string): Promise<VineyardBlockStats[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return generateMockStats(blockId)
    }

    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        // Fallback to mock statistics if no DB telemetry exists
        return generateMockStats(blockId)
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }))
    } catch (err: any) {
      console.error(`[GeoWorldLook] Error fetching stats for block ${blockId}:`, err.message)
      return generateMockStats(blockId)
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  }
}
