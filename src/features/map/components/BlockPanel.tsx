"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets, Info } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'both' | 'ndvi' | 'ndmi'>('both');
  const latestData = block.stats[block.stats.length - 1];

  const chartData = block.stats.map(d => ({
    ...d,
    monthYear: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }));

  const tickInterval = Math.ceil(chartData.length / 4);
  const ticks = chartData
    .filter((_, i) => i % tickInterval === 0)
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
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> NDVI
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3" /> NDMI
            </p>
            <p className="text-xl font-bold text-sky-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex gap-1 bg-white/5 p-1 rounded-md">
          {(['both', 'ndvi', 'ndmi'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-[10px] py-1 rounded transition-colors ${
                activeTab === tab ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={ticks}
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
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              {(activeTab === 'both' || activeTab === 'ndvi') && (
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
              {(activeTab === 'both' || activeTab === 'ndmi') && (
                <Line
                  name="NDMI (Moisture)"
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
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
