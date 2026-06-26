
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets } from 'lucide-react';
import { VineyardBlock } from '@/types/vineyards';
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
  const [activeMetric, setActiveMetric] = useState<'ndvi' | 'ndmi' | 'both'>('both');
  const latestData = block.stats[block.stats.length - 1];

  const chartData = block.stats.map(d => {
    const date = new Date(d.date);
    return {
      ...d,
      monthYear: `${date.getMonth()}-${date.getFullYear()}`,
      label: date.toLocaleDateString('en-US', { month: 'short' })
    };
  });

  // Filter to show one label per month on X axis, handling multi-year trends
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
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> NDVI
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              {latestData?.ndvi_mean.toFixed(2) || 'N/A'}
            </p>
          </div>
          <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3" /> NDMI
            </p>
            <p className="text-2xl font-bold text-sky-400">
              {latestData?.ndmi_mean.toFixed(2) || 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            className={`text-[10px] h-7 ${activeMetric === 'ndvi' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-white/10 text-gray-400'}`}
            onClick={() => setActiveMetric('ndvi')}
          >
            NDVI
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`text-[10px] h-7 ${activeMetric === 'ndmi' ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-transparent border-white/10 text-gray-400'}`}
            onClick={() => setActiveMetric('ndmi')}
          >
            NDMI
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`text-[10px] h-7 ${activeMetric === 'both' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/10 text-gray-400'}`}
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
                tickFormatter={(str) => {
                  const d = new Date(str);
                  return d.toLocaleDateString('en-US', { month: 'short' });
                }}
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
                itemStyle={{ fontSize: '10px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              {(activeMetric === 'ndvi' || activeMetric === 'both') && (
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
              {(activeMetric === 'ndmi' || activeMetric === 'both') && (
                <Line
                  type="monotone"
                  dataKey="ndmi_mean"
                  name="NDMI"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#0ea5e9' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 italic">
          <div className="flex items-center gap-1">
            <Cloud className="w-3 h-3" />
            Avg Cloud: {latestData?.cloud_cover || 0}%
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Last: {latestData?.date || 'N/A'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
