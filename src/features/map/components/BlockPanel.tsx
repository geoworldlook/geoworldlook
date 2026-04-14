
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets, Map as MapIcon } from 'lucide-react';
import { VineyardBlockWithStats } from '@/types/vineyard';
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
  block: VineyardBlockWithStats;
  onClose: () => void;
}

export default function BlockPanel({ block, onClose }: BlockPanelProps) {
  const [activeMetric, setActiveMetric] = useState<'both' | 'ndvi' | 'ndmi'>('both');
  const latestData = block.stats[block.stats.length - 1];

  const chartData = block.stats.map(d => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' })
  }));

  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.month === d.month))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapIcon className="w-3 h-3" /> {block.area_ha} ha
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveMetric('ndvi')}
            className={`p-3 rounded-lg border transition-all text-left ${activeMetric === 'ndvi' ? 'bg-emerald-400/10 border-emerald-400/50' : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]'}`}
          >
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> NDVI
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {latestData?.ndvi_mean.toFixed(2) || 'N/A'}
            </p>
          </button>
          <button
            onClick={() => setActiveMetric('ndmi')}
            className={`p-3 rounded-lg border transition-all text-left ${activeMetric === 'ndmi' ? 'bg-sky-400/10 border-sky-400/50' : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]'}`}
          >
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3" /> NDMI
            </p>
            <p className="text-xl font-bold text-sky-400">
              {latestData?.ndmi_mean.toFixed(2) || 'N/A'}
            </p>
          </button>
        </div>

        <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05] flex justify-between items-center">
          <p className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
            <Cloud className="w-3 h-3" /> Cloud Cover
          </p>
          <p className="text-sm font-semibold text-gray-300">
            {latestData?.cloud_cover}%
          </p>
        </div>

        <div className="h-48 w-full mt-2">
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
                domain={[0, 1]}
                stroke="#666"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                ticks={[0, 0.5, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                itemStyle={{ fontSize: '12px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />

              {(activeMetric === 'both' || activeMetric === 'ndvi') && (
                <Line
                  type="monotone"
                  dataKey="ndvi_mean"
                  name="NDVI (Vigor)"
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
                  name="NDMI (Moisture)"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#0ea5e9' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 italic mt-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Last updated: {latestData?.date || 'N/A'}
          </div>
          <button
            onClick={() => setActiveMetric('both')}
            className={`hover:text-white transition-colors ${activeMetric === 'both' ? 'text-emerald-400' : ''}`}
          >
            Show All
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
