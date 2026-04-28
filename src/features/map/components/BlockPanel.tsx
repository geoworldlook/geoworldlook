
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets } from 'lucide-react';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
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
  stats: VineyardStat[];
  onClose: () => void;
}

export default function BlockPanel({ block, stats, onClose }: BlockPanelProps) {
  const [activeMetric, setActiveMetric] = useState<'ndvi' | 'ndmi' | 'both'>('both');

  const latestData = stats[stats.length - 1] || { ndvi_mean: 0, ndmi_mean: 0, cloud_cover: 0, date: 'N/A' };

  const chartData = stats.map(d => ({
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
          <p className="text-xs text-gray-500">{block.area_ha} ha</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[8px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-2 h-2" /> NDVI
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[8px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-2 h-2" /> NDMI
            </p>
            <p className="text-lg font-bold text-sky-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[8px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Cloud className="w-2 h-2" /> Cloud
            </p>
            <p className="text-lg font-bold text-gray-400">
              {latestData.cloud_cover}%
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-2">
           <Button
            variant="outline"
            size="sm"
            className={`text-[10px] h-7 ${activeMetric === 'ndvi' ? 'bg-emerald-500/20 border-emerald-500/50' : ''}`}
            onClick={() => setActiveMetric('ndvi')}
           >
             NDVI
           </Button>
           <Button
            variant="outline"
            size="sm"
            className={`text-[10px] h-7 ${activeMetric === 'ndmi' ? 'bg-sky-500/20 border-sky-500/50' : ''}`}
            onClick={() => setActiveMetric('ndmi')}
           >
             NDMI
           </Button>
           <Button
            variant="outline"
            size="sm"
            className={`text-[10px] h-7 ${activeMetric === 'both' ? 'bg-white/10' : ''}`}
            onClick={() => setActiveMetric('both')}
           >
             Both
           </Button>
        </div>

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
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend verticalAlign="top" height={36}/>
              {(activeMetric === 'ndvi' || activeMetric === 'both') && (
                <Line
                  name="NDVI (Vigor)"
                  type="monotone"
                  dataKey="ndvi_mean"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              )}
              {(activeMetric === 'ndmi' || activeMetric === 'both') && (
                <Line
                  name="NDMI (Water)"
                  type="monotone"
                  dataKey="ndmi_mean"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#0ea5e9' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
          <Calendar className="w-3 h-3" />
          Last update: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
