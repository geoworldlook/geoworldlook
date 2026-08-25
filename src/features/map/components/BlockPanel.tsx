"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Droplets, Cloud, Calendar, Maximize2 } from 'lucide-react';
import { VineyardBlockProperties, VineyardStats } from '@/types/vineyard';
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
  block: VineyardBlockProperties & { timeSeries: VineyardStats[] };
  onClose: () => void;
}

export default function BlockPanel({ block, onClose }: BlockPanelProps) {
  const [activeMetric, setActiveMetric] = useState<'both' | 'ndvi' | 'ndmi'>('both');

  const timeSeries = block.timeSeries && block.timeSeries.length > 0
    ? block.timeSeries
    : [];

  const latestData = timeSeries.length > 0
    ? timeSeries[timeSeries.length - 1]
    : { date: 'N/A', ndvi_mean: 0, ndmi_mean: 0, cloud_cover: 0 };

  const chartData = timeSeries.map(d => {
    const dateObj = new Date(d.date);
    return {
      ...d,
      monthStr: dateObj.toLocaleDateString('en-US', { month: 'short' }),
      monthYear: `${dateObj.getFullYear()}-${dateObj.getMonth()}`
    };
  });

  // Filter X-axis labels using monthYear deduplication
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] scrollbar-thin scrollbar-thumb-emerald-500/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-white/[0.06]">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Vineyard Block
          </p>
          <CardTitle className="text-lg text-white font-bold">{block.name}</CardTitle>
          <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-emerald-400" />
              {block.area_ha ? `${block.area_ha} ha` : 'N/A'}
            </span>
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>

          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-sky-400" /> NDMI
            </p>
            <p className="text-lg font-bold text-sky-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>

          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-gray-400" /> Cloud
            </p>
            <p className="text-lg font-bold text-gray-300">
              {latestData.cloud_cover}%
            </p>
          </div>
        </div>

        {/* Index View Selector */}
        <div className="flex items-center justify-between bg-white/[0.02] p-1 rounded-lg border border-white/[0.05] text-xs">
          <span className="text-[10px] text-gray-400 uppercase px-2 font-medium">Metric:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveMetric('both')}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                activeMetric === 'both' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setActiveMetric('ndvi')}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                activeMetric === 'ndvi' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              NDVI
            </button>
            <button
              onClick={() => setActiveMetric('ndmi')}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                activeMetric === 'ndmi' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              NDMI
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 w-full bg-white/[0.01] rounded-lg p-1 border border-white/[0.03]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />

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
                  name="NDMI (Water Stress)"
                  type="monotone"
                  dataKey="ndmi_mean"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#38bdf8' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 italic pt-1 border-t border-white/[0.04]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-400" />
            Last observation: {latestData.date}
          </span>
          <span>Sentinel-2 L2A</span>
        </div>
      </CardContent>
    </Card>
  );
}
