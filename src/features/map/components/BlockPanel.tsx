
"use client"

import { useState } from 'react'
import { X, TreePine, Cloud, Droplets, LineChart } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { VineyardBlockWithStats } from '@/types/vineyard'

interface BlockPanelProps {
  block: VineyardBlockWithStats
  onClose: () => void
}

export default function BlockPanel({ block, onClose }: BlockPanelProps) {
  const [activeMetric, setActiveMetric] = useState<'both' | 'ndvi' | 'ndmi'>('both')

  return (
    <div className="absolute top-4 right-4 w-96 bg-[#0a0a0a]/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-300 z-50">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">{block.name}</h3>
          <p className="text-gray-500 text-[10px] uppercase tracking-wider mt-0.5">
            Vineyard Block • {block.area_ha} ha
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors group"
        >
          <X className="w-4 h-4 text-gray-500 group-hover:text-white" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Metric Selection */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
          <button
            onClick={() => setActiveMetric('both')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              activeMetric === 'both' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LineChart className="w-3 h-3" />
            Comparison
          </button>
          <button
            onClick={() => setActiveMetric('ndvi')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              activeMetric === 'ndvi' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <TreePine className="w-3 h-3" />
            NDVI
          </button>
          <button
            onClick={() => setActiveMetric('ndmi')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              activeMetric === 'ndmi' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Droplets className="w-3 h-3" />
            NDMI
          </button>
        </div>

        {/* Chart Section */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={block.stats}>
              <defs>
                <linearGradient id="colorNdvi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNdmi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#666"
                fontSize={8}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short' })}
              />
              <YAxis
                stroke="#666"
                fontSize={8}
                tickLine={false}
                axisLine={false}
                domain={[0, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '8px', fontSize: '10px' }}
                itemStyle={{ padding: '2px 0' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />

              {(activeMetric === 'both' || activeMetric === 'ndvi') && (
                <Area
                  type="monotone"
                  dataKey="ndvi_mean"
                  name="NDVI (Vigour)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNdvi)"
                />
              )}

              {(activeMetric === 'both' || activeMetric === 'ndmi') && (
                <Area
                  type="monotone"
                  dataKey="ndmi_mean"
                  name="NDMI (Moisture)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNdmi)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Latest Reading Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <TreePine className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-gray-500 font-medium uppercase">Avg NDVI</span>
            </div>
            <p className="text-white text-lg font-bold">
              {block.stats.length > 0 ? block.stats[block.stats.length - 1].ndvi_mean.toFixed(3) : 'N/A'}
            </p>
          </div>
          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] text-gray-500 font-medium uppercase">Avg NDMI</span>
            </div>
            <p className="text-white text-lg font-bold">
              {block.stats.length > 0 ? block.stats[block.stats.length - 1].ndmi_mean.toFixed(3) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Cloud Info */}
        {block.stats.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Cloud className="w-3 h-3 text-gray-500" />
              <span className="text-[10px] text-gray-400 font-medium uppercase">Satellite Reliability</span>
            </div>
            <span className="text-[10px] text-emerald-500 font-bold">
              {(100 - block.stats[block.stats.length - 1].cloud_cover).toFixed(1)}% Clear
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
