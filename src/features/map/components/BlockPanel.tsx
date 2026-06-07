
"use client"

import { useState } from 'react'
import { X, Calendar, Activity, Cloud, Droplets } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { VineyardBlockWithStats } from '@/types/vineyard'

interface BlockPanelProps {
  block: VineyardBlockWithStats
  onClose: () => void
}

export default function BlockPanel({ block, onClose }: BlockPanelProps) {
  const [activeTab, setActiveTab] = useState<'ndvi' | 'ndmi'>('ndvi');

  return (
    <div className="absolute top-6 right-6 w-96 bg-[#0a0a0a]/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right duration-300 overflow-hidden z-20">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-emerald-500/5">
        <div>
          <h3 className="text-white font-bold text-lg leading-none">{block.name}</h3>
          <p className="text-gray-500 text-[10px] mt-2 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-emerald-500" />
            SATELLITE TELEMETRY • {block.area_ha} HA
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-lg">
          <button
            onClick={() => setActiveTab('ndvi')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
              activeTab === 'ndvi' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3" />
            NDVI
          </button>
          <button
            onClick={() => setActiveTab('ndmi')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
              activeTab === 'ndmi' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Droplets className="w-3 h-3" />
            NDMI
          </button>
        </div>

        {/* Chart */}
        <div className="h-48 w-full mb-6 relative">
           <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={block.stats}>
              <defs>
                <linearGradient id="colorIndex" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeTab === 'ndvi' ? "#10b981" : "#3b82f6"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={activeTab === 'ndvi' ? "#10b981" : "#3b82f6"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis
                dataKey="date"
                hide
              />
              <YAxis
                domain={[0, 1]}
                tick={{fill: '#4b5563', fontSize: 10}}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '10px'}}
                itemStyle={{color: '#fff'}}
                labelStyle={{color: '#666', marginBottom: '4px'}}
                formatter={(val: number) => [val.toFixed(3), activeTab.toUpperCase()]}
              />
              <Area
                type="monotone"
                dataKey={activeTab === 'ndvi' ? "ndvi_mean" : "ndmi_mean"}
                stroke={activeTab === 'ndvi' ? "#10b981" : "#3b82f6"}
                fillOpacity={1}
                fill="url(#colorIndex)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="w-3 h-3 text-sky-400" />
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Avg Cloud</span>
            </div>
            <p className="text-white font-mono text-lg">
              {(block.stats.reduce((acc, s) => acc + s.cloud_cover, 0) / block.stats.length).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Samples</span>
            </div>
            <p className="text-white font-mono text-lg">{block.stats.length}</p>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="px-5 py-3 bg-white/5 flex items-center justify-center">
        <p className="text-[8px] text-gray-600 uppercase tracking-[0.2em] font-bold">
          Updated from Sentinel-2A via Copernicus API
        </p>
      </div>
    </div>
  )
}
