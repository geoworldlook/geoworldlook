"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Layers, Eye, EyeOff } from 'lucide-react';
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
  const stats = block.stats || [];
  const latestData = stats[stats.length - 1] || {
    ndvi_mean: 0,
    ndmi_mean: 0,
    cloud_cover: 0,
    date: 'N/A'
  };

  const [showNdvi, setShowNdvi] = useState(true);
  const [showNdmi, setShowNdmi] = useState(true);

  const chartData = stats.map(d => ({
    ...d,
    monthYear: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    monthLabel: new Date(d.date).toLocaleDateString('en-US', { month: 'short' })
  }));

  // Filter to show distinct labels across years
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/95 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] max-h-[90%] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Parcel</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha.toFixed(2)} hectares (ha)</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Real-time stats cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1 font-semibold">
              <Layers className="w-3 h-3 text-cyan-400" /> NDMI
            </p>
            <p className="text-xl font-bold text-cyan-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1 font-semibold">
              <Cloud className="w-3 h-3 text-sky-400" /> Cloud
            </p>
            <p className="text-xl font-bold text-sky-400">
              {latestData.cloud_cover.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center gap-4 bg-white/[0.02] p-2 rounded-lg border border-white/[0.05]">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Toggles:</span>
          <button
            onClick={() => setShowNdvi(!showNdvi)}
            className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-2.5 rounded-md border transition-all ${
              showNdvi
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'border-white/10 text-gray-500'
            }`}
          >
            {showNdvi ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            NDVI
          </button>
          <button
            onClick={() => setShowNdmi(!showNdmi)}
            className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-2.5 rounded-md border transition-all ${
              showNdmi
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                : 'border-white/10 text-gray-500'
            }`}
          >
            {showNdmi ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            NDMI
          </button>
        </div>

        {/* Historical Chart */}
        <div className="h-48 w-full bg-white/[0.01] rounded-lg border border-white/[0.02] p-2">
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
                domain={[-0.2, 1.0]}
                stroke="#666"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                ticks={[-0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px', borderRadius: '6px' }}
                itemStyle={{ padding: '2px 0' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              {showNdvi && (
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
              {showNdmi && (
                <Line
                  type="monotone"
                  dataKey="ndmi_mean"
                  name="NDMI"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#06b6d4' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
          <Calendar className="w-3 h-3" />
          Last updated: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
