
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets } from 'lucide-react';
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
  const latestData = block.stats[block.stats.length - 1] || {
    ndvi_mean: 0,
    ndmi_mean: 0,
    cloud_cover: 0,
    date: 'No data'
  };

  const chartData = block.stats.map(d => {
    const dateObj = new Date(d.date);
    return {
      ...d,
      month: dateObj.toLocaleDateString('en-US', { month: 'short' }),
      monthYear: dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };
  });

  // Filter to show one label per month-year on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
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
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> NDVI
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3" /> NDMI
            </p>
            <p className="text-lg font-bold text-blue-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Cloud className="w-3 h-3" /> Cloud
            </p>
            <p className="text-lg font-bold text-sky-400">
              {latestData.cloud_cover}%
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-2">
           <Button
            variant="outline"
            size="sm"
            className={`h-7 text-[10px] ${activeMetric === 'both' ? 'bg-emerald-500/20' : ''}`}
            onClick={() => setActiveMetric('both')}
           >Both</Button>
           <Button
            variant="outline"
            size="sm"
            className={`h-7 text-[10px] ${activeMetric === 'ndvi' ? 'bg-emerald-500/20' : ''}`}
            onClick={() => setActiveMetric('ndvi')}
           >NDVI</Button>
           <Button
            variant="outline"
            size="sm"
            className={`h-7 text-[10px] ${activeMetric === 'ndmi' ? 'bg-blue-500/20' : ''}`}
            onClick={() => setActiveMetric('ndmi')}
           >NDMI</Button>
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
                domain={[-1, 1]}
                stroke="#666"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                ticks={[-1, -0.5, 0, 0.5, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
              {(activeMetric === 'both' || activeMetric === 'ndvi') && (
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
              {(activeMetric === 'both' || activeMetric === 'ndmi') && (
                <Line
                  type="monotone"
                  dataKey="ndmi_mean"
                  name="NDMI"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 italic">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Last updated: {latestData.date}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
