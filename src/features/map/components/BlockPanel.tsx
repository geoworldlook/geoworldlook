"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplet, Layers } from 'lucide-react';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
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
  const [showNdvi, setShowNdvi] = useState(true);
  const [showNdmi, setShowNdmi] = useState(true);

  const stats = block.stats || [];
  const latestData = stats[stats.length - 1] || {
    ndvi_mean: 0,
    ndmi_mean: 0,
    cloud_cover: 0,
    date: 'N/A'
  };

  const chartData = stats.map(d => {
    const dateObj = new Date(d.date);
    return {
      ...d,
      month: dateObj.toLocaleDateString('en-US', { month: 'short' }),
      year: dateObj.getFullYear(),
      monthYear: `${dateObj.getFullYear()}-${dateObj.getMonth()}` // composite key for year span
    };
  });

  // Filter to show distinct labels even when data spans multiple calendar years
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] max-h-[90%] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Winnica Poligon</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">Obszar: {block.area_ha.toFixed(2)} ha</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Toggle Controls */}
        <div className="flex gap-2 pb-2 border-b border-white/5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNdvi(!showNdvi)}
            className={`text-[10px] h-7 px-2.5 transition-all ${showNdvi ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'text-gray-400 border-white/10'}`}
          >
            NDVI
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNdmi(!showNdmi)}
            className={`text-[10px] h-7 px-2.5 transition-all ${showNdmi ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'text-gray-400 border-white/10'}`}
          >
            NDMI (Wilgotność)
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" /> NDVI
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Droplet className="w-2.5 h-2.5" /> NDMI
            </p>
            <p className="text-lg font-bold text-cyan-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Cloud className="w-2.5 h-2.5" /> Chmury
            </p>
            <p className="text-lg font-bold text-sky-400">
              {latestData.cloud_cover}%
            </p>
          </div>
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
                domain={[-0.5, 1]}
                stroke="#666"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                ticks={[-0.5, 0, 0.5, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px' }}
                itemStyle={{ fontSize: '11px' }}
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
          Aktualizacja: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
