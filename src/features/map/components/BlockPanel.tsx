"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Droplets, Cloud, Calendar, Layers } from 'lucide-react';
import { VineyardBlock, VineyardTimeSeries } from '@/types/vineyards';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface BlockPanelProps {
  block: VineyardBlock & { timeSeries: VineyardTimeSeries[] };
  onClose: () => void;
}

export default function BlockPanel({ block, onClose }: BlockPanelProps) {
  const [activeMetric, setActiveMetric] = useState<'both' | 'ndvi' | 'ndmi'>('both');

  const latestData = block.timeSeries[block.timeSeries.length - 1] || {
    ndvi_mean: 0,
    ndmi_mean: 0,
    cloud_cover: 0,
    date: 'N/A'
  };

  const chartData = block.timeSeries.map(d => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' }),
    monthYear: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }));

  // Filter to show one label per month on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] max-h-[90%] overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
            <Layers className="w-3 h-3" /> Vineyard Polygon Block
          </p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-400">Area: <span className="text-emerald-400 font-semibold">{block.area_ha} ha</span></p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> Mean NDVI
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>

          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-cyan-400" /> Mean NDMI
            </p>
            <p className="text-xl font-bold text-cyan-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>

          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-sky-400" /> Cloud
            </p>
            <p className="text-xl font-bold text-sky-400">
              {latestData.cloud_cover}%
            </p>
          </div>
        </div>

        {/* Index Selector */}
        <div className="flex items-center justify-between text-[11px] bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
          <span className="text-gray-400 px-2 font-medium">Indices:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveMetric('both')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                activeMetric === 'both' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveMetric('ndvi')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                activeMetric === 'ndvi' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              NDVI
            </button>
            <button
              onClick={() => setActiveMetric('ndmi')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                activeMetric === 'ndmi' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              NDMI
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 w-full">
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
                domain={[-0.2, 1]}
                stroke="#666"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                ticks={[-0.2, 0, 0.5, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px', borderRadius: '8px' }}
                itemStyle={{ fontSize: '11px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
              {(activeMetric === 'both' || activeMetric === 'ndvi') && (
                <Line
                  name="NDVI (Vegetation)"
                  type="monotone"
                  dataKey="ndvi_mean"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              )}
              {(activeMetric === 'both' || activeMetric === 'ndmi') && (
                <Line
                  name="NDMI (Moisture)"
                  type="monotone"
                  dataKey="ndmi_mean"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#06b6d4' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
          <Calendar className="w-3 h-3" />
          Last Copernicus observation: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
