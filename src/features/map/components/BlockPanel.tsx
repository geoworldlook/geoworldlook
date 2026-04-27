
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Droplets, Calendar, Layers } from 'lucide-react';
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

  // Filter to show one label per month on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.month === d.month))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
            <Layers className="w-3 h-3" /> Vineyard Block
          </p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha ? `${block.area_ha} ha` : 'Area not specified'}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setActiveMetric('ndvi')}
            className={`text-left p-3 rounded-lg border transition-all ${activeMetric === 'ndvi' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]'}`}
          >
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> NDVI (Veg)
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              {latestData ? latestData.ndvi_mean.toFixed(2) : '--'}
            </p>
          </button>
          <button
            onClick={() => setActiveMetric('ndmi')}
            className={`text-left p-3 rounded-lg border transition-all ${activeMetric === 'ndmi' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]'}`}
          >
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3" /> NDMI (Water)
            </p>
            <p className="text-2xl font-bold text-blue-400">
              {latestData ? latestData.ndmi_mean.toFixed(2) : '--'}
            </p>
          </button>
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
                ticks={[-0.2, 0, 0.2, 0.4, 0.6, 0.8, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend verticalAlign="top" height={36}/>
              {(activeMetric === 'both' || activeMetric === 'ndvi') && (
                <Line
                  name="NDVI"
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
                  name="NDMI"
                  type="monotone"
                  dataKey="ndmi_mean"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {latestData && (
          <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
            <Calendar className="w-3 h-3" />
            Last satellite capture: {latestData.date}
          </div>
        )}

        {activeMetric !== 'both' && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[10px] uppercase text-gray-500 hover:text-white"
            onClick={() => setActiveMetric('both')}
          >
            Show combined view
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
