
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets } from 'lucide-react';
import { VineyardBlockWithStats } from '@/types/vineyards';
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
  block: VineyardBlockWithStats;
  onClose: () => void;
}

export default function BlockPanel({ block, onClose }: BlockPanelProps) {
  const [activeTab, setActiveTab] = useState<'ndvi' | 'ndmi'>('ndvi');
  const latestData = block.stats[block.stats.length - 1] || { ndvi_mean: 0, ndmi_mean: 0, cloud_cover: 0, date: 'N/A' };

  const chartData = block.stats.map(d => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' }),
    monthYear: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }));

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
          <button
            onClick={() => setActiveTab('ndvi')}
            className={`p-3 rounded-lg border transition-all text-left ${activeTab === 'ndvi' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/[0.03] border-white/[0.05] hover:border-white/20'}`}
          >
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> NDVI
            </p>
            <p className={`text-2xl font-bold ${activeTab === 'ndvi' ? 'text-emerald-400' : 'text-emerald-400/60'}`}>
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </button>
          <button
            onClick={() => setActiveTab('ndmi')}
            className={`p-3 rounded-lg border transition-all text-left ${activeTab === 'ndmi' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/[0.03] border-white/[0.05] hover:border-white/20'}`}
          >
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3" /> NDMI
            </p>
            <p className={`text-2xl font-bold ${activeTab === 'ndmi' ? 'text-blue-400' : 'text-blue-400/60'}`}>
              {latestData.ndmi_mean.toFixed(2)}
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
                domain={activeTab === 'ndvi' ? [0, 1] : [-1, 1]}
                stroke="#666"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                itemStyle={{ color: activeTab === 'ndvi' ? '#10b981' : '#3b82f6' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey={activeTab === 'ndvi' ? 'ndvi_mean' : 'ndmi_mean'}
                stroke={activeTab === 'ndvi' ? '#10b981' : '#3b82f6'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: activeTab === 'ndvi' ? '#10b981' : '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 italic">
          <span className="flex items-center gap-1"><Cloud className="w-3 h-3" /> Cloud: {latestData.cloud_cover}%</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Last: {latestData.date}</span>
        </div>
      </CardContent>
    </Card>
  );
}
