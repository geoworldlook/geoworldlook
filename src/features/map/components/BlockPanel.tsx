"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Droplets, Cloud, Calendar, Layers } from 'lucide-react';
import { VineyardBlock } from '@/types/vineyard';
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
  block: VineyardBlock;
  onClose: () => void;
}

export default function BlockPanel({ block, onClose }: BlockPanelProps) {
  const [activeMetric, setActiveMetric] = useState<'both' | 'ndvi' | 'ndmi'>('both');

  const latestData = block.timeSeries.length > 0
    ? block.timeSeries[block.timeSeries.length - 1]
    : { ndvi_mean: 0, ndmi_mean: 0, cloud_cover: 0, date: 'N/A' };

  const chartData = block.timeSeries.map(d => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' })
  }));

  // Filter to show unique month labels on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.month === d.month))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
              <Layers className="w-3 h-3" /> Vineyard Parcel
            </span>
            <span className="text-[10px] text-gray-400 bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/10 font-mono">
              {block.area_ha} ha
            </span>
          </div>
          <CardTitle className="text-lg text-white font-semibold mt-1">{block.name}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
            <p className="text-[9px] text-emerald-400/80 uppercase font-medium mb-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> NDVI
            </p>
            <p className="text-xl font-bold text-emerald-400 font-mono">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
            <p className="text-[8px] text-emerald-500/60 mt-0.5">Vegetation</p>
          </div>

          <div className="bg-sky-950/30 p-2.5 rounded-lg border border-sky-500/20">
            <p className="text-[9px] text-sky-400/80 uppercase font-medium mb-0.5 flex items-center gap-1">
              <Droplets className="w-3 h-3" /> NDMI
            </p>
            <p className="text-xl font-bold text-sky-400 font-mono">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
            <p className="text-[8px] text-sky-500/60 mt-0.5">Moisture Stress</p>
          </div>

          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase font-medium mb-0.5 flex items-center gap-1">
              <Cloud className="w-3 h-3" /> Clouds
            </p>
            <p className="text-xl font-bold text-gray-200 font-mono">
              {latestData.cloud_cover}%
            </p>
            <p className="text-[8px] text-gray-500 mt-0.5">Coverage</p>
          </div>
        </div>

        {/* Index Selector / Filter */}
        <div className="flex items-center justify-between text-xs bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
          <span className="text-[10px] text-gray-400 px-2 font-medium">Indices:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveMetric('both')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                activeMetric === 'both' ? 'bg-white/20 text-white font-medium' : 'text-gray-400 hover:text-white'
              }`}>
              Both
            </button>
            <button
              onClick={() => setActiveMetric('ndvi')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                activeMetric === 'ndvi' ? 'bg-emerald-500/30 text-emerald-400 font-medium' : 'text-gray-400 hover:text-white'
              }`}>
              NDVI
            </button>
            <button
              onClick={() => setActiveMetric('ndmi')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                activeMetric === 'ndmi' ? 'bg-sky-500/30 text-sky-400 font-medium' : 'text-gray-400 hover:text-white'
              }`}>
              NDMI
            </button>
          </div>
        </div>

        {/* Recharts Chart */}
        <div className="h-48 w-full pt-1">
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
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '6px', fontSize: '11px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend
                verticalAlign="top"
                height={24}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px' }}
              />
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
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#0284c7' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-white/[0.05]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Last telemetry: {latestData.date}
          </span>
          <span className="font-mono text-emerald-400/80">Sentinel-2 L2A</span>
        </div>
      </CardContent>
    </Card>
  );
}
