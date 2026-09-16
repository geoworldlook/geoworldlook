"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets, Layers } from 'lucide-react';
import { VineyardBlock } from '@/types/vineyard';
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
  const [activeMetric, setActiveMetric] = useState<'all' | 'ndvi' | 'ndmi'>('all');
  const timeSeries = block.timeSeries || [];
  const latestData = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1] : {
    date: 'N/A',
    ndvi_mean: 0,
    ndmi_mean: 0,
    cloud_cover: 0
  };

  const chartData = timeSeries.map(d => {
    const dateObj = new Date(d.date);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const monthYear = `${dateObj.getFullYear()}-${dateObj.getMonth()}`;
    return {
      ...d,
      month,
      monthYear
    };
  });

  // Filter X-axis ticks to show unique month labels using composite monthYear key
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
            <Layers className="w-3 h-3" /> Vineyard Parcel
          </p>
          <CardTitle className="text-lg text-white font-semibold">{block.name}</CardTitle>
          <p className="text-xs text-gray-400">{block.area_ha} ha · Sentinel-2 Monitoring</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
            <p className="text-[9px] text-gray-500">Vegetation</p>
          </div>

          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1 font-medium">
              <Droplets className="w-3 h-3 text-cyan-400" /> NDMI
            </p>
            <p className="text-xl font-bold text-cyan-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
            <p className="text-[9px] text-gray-500">Moisture</p>
          </div>

          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1 font-medium">
              <Cloud className="w-3 h-3 text-sky-400" /> Cloud
            </p>
            <p className="text-xl font-bold text-sky-400">
              {latestData.cloud_cover}%
            </p>
            <p className="text-[9px] text-gray-500">Coverage</p>
          </div>
        </div>

        {/* Index Toggle */}
        <div className="flex items-center justify-between text-[11px] bg-white/[0.02] p-1 rounded-lg border border-white/[0.05]">
          <span className="text-gray-400 px-2 font-medium">Indices:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveMetric('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                activeMetric === 'all'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setActiveMetric('ndvi')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                activeMetric === 'ndvi'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              NDVI
            </button>
            <button
              onClick={() => setActiveMetric('ndmi')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                activeMetric === 'ndmi'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              NDMI
            </button>
          </div>
        </div>

        {/* Recharts Chart */}
        <div className="h-48 w-full pt-2">
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
                ticks={[-0.2, 0.2, 0.6, 1.0]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px', borderRadius: '8px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              {(activeMetric === 'all' || activeMetric === 'ndvi') && (
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
              {(activeMetric === 'all' || activeMetric === 'ndmi') && (
                <Line
                  name="NDMI (Moisture)"
                  type="monotone"
                  dataKey="ndmi_mean"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#22d3ee' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 italic pt-1 border-t border-white/[0.05]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-400" />
            Last Satellite Observation: {latestData.date}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
