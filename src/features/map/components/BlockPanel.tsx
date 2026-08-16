"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets, Layers } from 'lucide-react';
import { VineyardBlock, VineyardStats } from '@/types/database.types';
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
  stats: VineyardStats[];
  onClose: () => void;
}

export default function BlockPanel({ block, stats, onClose }: BlockPanelProps) {
  const [indexView, setIndexView] = useState<'both' | 'ndvi' | 'ndmi'>('both');

  const latestData = stats.length > 0 ? stats[stats.length - 1] : {
    ndvi_mean: 0,
    ndmi_mean: 0,
    cloud_cover: 0,
    date: 'N/A'
  };

  const chartData = stats.map(d => ({
    ...d,
    monthYear: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }));

  // Filter unique month-year ticks for clean x-axis visualization
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-3 right-3 w-72 md:w-80 max-h-[92%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] text-white p-1">
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3 space-y-0">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
            <Layers className="w-2.5 h-2.5" /> Vineyard Block
          </p>
          <CardTitle className="text-base text-white font-semibold">{block.name}</CardTitle>
          <p className="text-[11px] text-gray-400">{block.area_ha ? `${block.area_ha} ha` : 'N/A Area'}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white h-7 w-7">
          <X className="w-3.5 h-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3 px-3 pb-3">
        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[8px] text-gray-400 uppercase mb-0.5 flex items-center gap-0.5 font-medium">
              <TrendingUp className="w-2 h-2 text-emerald-400" /> NDVI
            </p>
            <p className="text-base font-bold text-emerald-400 leading-none">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
            <p className="text-[8px] text-gray-500 mt-0.5">Vegetation</p>
          </div>

          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[8px] text-gray-400 uppercase mb-0.5 flex items-center gap-0.5 font-medium">
              <Droplets className="w-2 h-2 text-blue-400" /> NDMI
            </p>
            <p className="text-base font-bold text-blue-400 leading-none">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
            <p className="text-[8px] text-gray-500 mt-0.5">Moisture</p>
          </div>

          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[8px] text-gray-400 uppercase mb-0.5 flex items-center gap-0.5 font-medium">
              <Cloud className="w-2 h-2 text-sky-400" /> Cloud
            </p>
            <p className="text-base font-bold text-sky-400 leading-none">
              {latestData.cloud_cover}%
            </p>
            <p className="text-[8px] text-gray-500 mt-0.5">Cover</p>
          </div>
        </div>

        {/* Index Selector Controls */}
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-1.5">
          <span className="text-[9px] text-gray-400 uppercase font-medium">Index Trend:</span>
          <div className="flex gap-1 bg-white/[0.05] p-0.5 rounded-md text-[9px]">
            <button
              onClick={() => setIndexView('both')}
              className={`px-1.5 py-0.5 rounded transition ${indexView === 'both' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Both
            </button>
            <button
              onClick={() => setIndexView('ndvi')}
              className={`px-1.5 py-0.5 rounded transition ${indexView === 'ndvi' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              NDVI
            </button>
            <button
              onClick={() => setIndexView('ndmi')}
              className={`px-1.5 py-0.5 rounded transition ${indexView === 'ndmi' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              NDMI
            </button>
          </div>
        </div>

        {/* Recharts Chart */}
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={monthTicks}
                tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 1]}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                ticks={[0, 0.5, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px', borderRadius: '6px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              {(indexView === 'both' || indexView === 'ndvi') && (
                <Line
                  name="NDVI"
                  type="monotone"
                  dataKey="ndvi_mean"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: '#10b981' }}
                />
              )}
              {(indexView === 'both' || indexView === 'ndmi') && (
                <Line
                  name="NDMI"
                  type="monotone"
                  dataKey="ndmi_mean"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: '#3b82f6' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[9px] text-gray-500 italic pt-0.5">
          <span className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            Last observation: {latestData.date}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
