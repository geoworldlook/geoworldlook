"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { X, TrendingUp, Cloud, Calendar, Layers, Activity } from 'lucide-react'
import { VineyardBlockStats } from '@/types/vineyard'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface BlockPanelProps {
  block: any
  stats: VineyardBlockStats[]
  onClose: () => void
}

export default function BlockPanel({ block, stats, onClose }: BlockPanelProps) {
  const [showNdvi, setShowNdvi] = useState(true)
  const [showNdmi, setShowNdmi] = useState(true)

  const properties = block.properties || {}
  const blockName = properties.name || 'Unnamed Block'
  const areaHa = properties.area_ha || null

  const latestStats = stats.length > 0 ? stats[stats.length - 1] : null

  // Process data for Recharts, building a nice month/year tick formatting
  const chartData = stats.map(s => {
    const dateObj = new Date(s.date)
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' })
    const year = dateObj.getFullYear()
    return {
      ...s,
      monthYear: `${month} ${year}`,
      month
    }
  })

  // Group by monthYear to make sure labels on X axis are distinct
  const monthYearTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date)

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
            <Layers className="w-3 h-3" /> Vineyard Block
          </p>
          <CardTitle className="text-lg text-white font-bold leading-tight">{blockName}</CardTitle>
          {areaHa && (
            <p className="text-xs text-gray-500 font-medium">Area: <span className="text-gray-300">{areaHa} ha</span></p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Latest Indicators */}
        {latestStats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
              <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> Latest NDVI
              </p>
              <p className="text-2xl font-bold text-emerald-400">
                {latestStats.ndvi_mean.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
              <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" /> Latest NDMI
              </p>
              <p className="text-2xl font-bold text-cyan-400">
                {latestStats.ndmi_mean.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Index Selector Toggles */}
        <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.05] space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Configure Chart Layers</p>
          <div className="flex items-center justify-between">
            <Label htmlFor="ndvi-toggle" className="text-xs text-gray-300 cursor-pointer flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              NDVI (Vegetation Index)
            </Label>
            <Switch
              id="ndvi-toggle"
              checked={showNdvi}
              onCheckedChange={setShowNdvi}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ndmi-toggle" className="text-xs text-gray-300 cursor-pointer flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              NDMI (Moisture Index)
            </Label>
            <Switch
              id="ndmi-toggle"
              checked={showNdmi}
              onCheckedChange={setShowNdmi}
              className="data-[state=checked]:bg-cyan-400"
            />
          </div>
        </div>

        {/* Dynamic Chart */}
        {stats.length > 0 && (showNdvi || showNdmi) ? (
          <div className="h-48 w-full bg-white/[0.01] rounded-lg p-1 border border-white/[0.03]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis
                  dataKey="date"
                  ticks={monthYearTicks}
                  tickFormatter={(str) => {
                    const dateObj = new Date(str)
                    return dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                  }}
                  stroke="#555"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[-1, 1]}
                  stroke="#555"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  ticks={[-1.0, -0.5, 0.0, 0.5, 1.0]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #222', fontSize: '11px', borderRadius: '6px' }}
                  labelStyle={{ color: '#888', fontWeight: 'bold' }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                {showNdvi && (
                  <Line
                    type="monotone"
                    dataKey="ndvi_mean"
                    name="NDVI"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#10b981' }}
                  />
                )}
                {showNdmi && (
                  <Line
                    type="monotone"
                    dataKey="ndmi_mean"
                    name="NDMI"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#22d3ee' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 w-full bg-white/[0.01] rounded-lg border border-dashed border-white/[0.08] flex items-center justify-center p-4 text-center">
            <p className="text-xs text-gray-500">Toggle on NDVI or NDMI to visualize historical satellite curves.</p>
          </div>
        )}

        {/* Footer/Meta */}
        {latestStats && (
          <div className="flex items-center justify-between text-[9px] text-gray-500 italic pt-1 border-t border-white/[0.05]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Updated: {latestStats.date}
            </span>
            <span className="flex items-center gap-1">
              <Cloud className="w-3 h-3" /> Cloud: {latestStats.cloud_cover}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
