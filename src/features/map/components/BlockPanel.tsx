"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Layers, Activity } from 'lucide-react';
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
  stats: VineyardStat[];
  onClose: () => void;
}

export default function BlockPanel({ block, stats, onClose }: BlockPanelProps) {
  const [viewMode, setViewMode] = useState<'ndvi' | 'ndmi' | 'both'>('both');

  if (stats.length === 0) {
    return (
      <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] p-4 text-center">
        <p className="text-gray-400 text-sm">No historical stats available for this block.</p>
        <Button onClick={onClose} className="mt-4 text-xs">Close</Button>
      </Card>
    );
  }

  const latestData = stats[stats.length - 1];

  // Format the chart data and calculate composite monthYear key
  const chartData = stats.map(d => {
    const dateObj = new Date(d.date);
    return {
      ...d,
      monthYear: dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), // e.g. "May 2024"
      displayMonth: dateObj.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  // Filter to show one label per month on X axis using composite monthYear key for deduplication
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/[0.1] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/[0.2] shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
            <Layers className="w-3 h-3" /> Vineyard Block
          </p>
          <CardTitle className="text-lg text-white font-bold leading-tight">{block.name}</CardTitle>
          <p className="text-xs text-gray-500 font-medium">Area: <span className="text-emerald-400 font-semibold">{block.area_ha.toFixed(2)} ha</span></p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
            <p className="text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI (Mean)
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(3)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
            <p className="text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-sky-400" /> NDMI (Moisture)
            </p>
            <p className="text-xl font-bold text-sky-400">
              {latestData.ndmi_mean.toFixed(3)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05] col-span-2 flex justify-between items-center">
            <p className="text-[10px] text-gray-400 uppercase flex items-center gap-1">
              <Cloud className="w-3 h-3 text-gray-400" /> Cloud Cover
            </p>
            <p className="text-sm font-bold text-gray-200">
              {latestData.cloud_cover.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="flex bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.05] text-xs gap-1">
          <button
            onClick={() => setViewMode('ndvi')}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'ndvi' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            NDVI
          </button>
          <button
            onClick={() => setViewMode('ndmi')}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'ndmi' ? 'bg-sky-500 text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            NDMI
          </button>
          <button
            onClick={() => setViewMode('both')}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'both' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Both
          </button>
        </div>

        {/* Historical Chart */}
        <div className="h-48 w-full border border-white/[0.03] p-2 rounded-lg bg-black/40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={monthTicks}
                tickFormatter={(str) => {
                  const dateObj = new Date(str);
                  return dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                }}
                stroke="#555"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[-0.5, 1]}
                stroke="#555"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                ticks={[-0.5, 0, 0.5, 1.0]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '6px', fontSize: '11px' }}
                itemStyle={{ fontSize: '11px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />

              {(viewMode === 'ndvi' || viewMode === 'both') && (
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

              {(viewMode === 'ndmi' || viewMode === 'both') && (
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

        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic pb-1">
          <Calendar className="w-3 h-3" />
          Last updated: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
