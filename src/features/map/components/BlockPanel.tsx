"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Droplets, Cloud, Calendar, Layers } from 'lucide-react';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface BlockPanelProps {
  block: VineyardBlock;
  onClose: () => void;
}

export default function BlockPanel({ block, onClose }: BlockPanelProps) {
  const [activeMetric, setActiveMetric] = useState<'both' | 'ndvi' | 'ndmi'>('both');

  const stats = block.stats && block.stats.length > 0 ? block.stats : [];
  const latestData: VineyardStat = stats.length > 0
    ? stats[stats.length - 1]
    : { date: 'N/A', ndvi_mean: 0, ndmi_mean: 0, cloud_cover: 0 };

  const chartData = stats.map(d => ({
    ...d,
    monthYear: `${new Date(d.date).getFullYear()}-${new Date(d.date).getMonth()}`,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' })
  }));

  // Deduplicate ticks for XAxis using composite month-year key to avoid duplicate month labels across years
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Parcel Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha} ha</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
            <p className="text-[9px] text-gray-500">Vegetation</p>
          </div>

          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-cyan-400" /> NDMI
            </p>
            <p className="text-xl font-bold text-cyan-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
            <p className="text-[9px] text-gray-500">Moisture</p>
          </div>

          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-sky-400" /> Clouds
            </p>
            <p className="text-xl font-bold text-sky-400">
              {latestData.cloud_cover}%
            </p>
            <p className="text-[9px] text-gray-500">Cover</p>
          </div>
        </div>

        {/* Index Toggle */}
        <div className="flex items-center justify-between bg-white/[0.02] p-1 rounded-lg border border-white/[0.05]">
          <span className="text-[10px] text-gray-400 px-2 flex items-center gap-1">
            <Layers className="w-3 h-3 text-gray-400" /> Indices:
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveMetric('both')}
              className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                activeMetric === 'both' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setActiveMetric('ndvi')}
              className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                activeMetric === 'ndvi' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              NDVI
            </button>
            <button
              onClick={() => setActiveMetric('ndmi')}
              className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                activeMetric === 'ndmi' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              NDMI
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis
                  dataKey="date"
                  ticks={monthTicks}
                  tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                  stroke="#666"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[-0.5, 1]}
                  stroke="#666"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  ticks={[-0.5, 0, 0.5, 1]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px', borderRadius: '6px' }}
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value: any, name: any) => [
                    typeof value === 'number' ? value.toFixed(3) : value,
                    name === 'ndvi_mean' ? 'NDVI (Veg)' : 'NDMI (Moisture)'
                  ]}
                />
                {(activeMetric === 'both' || activeMetric === 'ndvi') && (
                  <Line
                    type="monotone"
                    dataKey="ndvi_mean"
                    name="ndvi_mean"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#10b981' }}
                  />
                )}
                {(activeMetric === 'both' || activeMetric === 'ndmi') && (
                  <Line
                    type="monotone"
                    dataKey="ndmi_mean"
                    name="ndmi_mean"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#22d3ee' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-gray-500">
              No historical data available
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
          <Calendar className="w-3 h-3" />
          Last satellite scan: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
