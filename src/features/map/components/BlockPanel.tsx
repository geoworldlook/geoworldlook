"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'ndvi' | 'ndmi' | 'both'>('ndvi');
  const latestData = block.stats[block.stats.length - 1];

  if (!latestData) {
    return (
      <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md z-[1000]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
            <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm italic text-center py-8">No satellite data available for this block.</p>
        </CardContent>
      </Card>
    );
  }

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
          <p className="text-xs text-gray-500">{block.area_ha} hectares</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className={`bg-white/[0.03] p-3 rounded-lg border ${activeTab === 'ndvi' ? 'border-emerald-500/50' : 'border-white/[0.05]'} cursor-pointer transition-colors`}
               onClick={() => setActiveTab('ndvi')}>
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> NDVI (Vigor)
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>
          <div className={`bg-white/[0.03] p-3 rounded-lg border ${activeTab === 'ndmi' ? 'border-sky-500/50' : 'border-white/[0.05]'} cursor-pointer transition-colors`}
               onClick={() => setActiveTab('ndmi')}>
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3" /> NDMI (Moisture)
            </p>
            <p className="text-2xl font-bold text-sky-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
           <Button
            variant="outline"
            size="sm"
            className={`text-[10px] h-7 ${activeTab === 'both' ? 'bg-white/10' : ''}`}
            onClick={() => setActiveTab('both')}
           >
            View Comparison
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
                domain={[-1, 1]}
                stroke="#666"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                itemStyle={{ fontSize: '10px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              {(activeTab === 'ndvi' || activeTab === 'both') && (
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
              {(activeTab === 'ndmi' || activeTab === 'both') && (
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
              {activeTab === 'both' && <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
            <Cloud className="w-3 h-3" />
            Cloud: {latestData.cloud_cover}%
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
            <Calendar className="w-3 h-3" />
            {latestData.date}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
