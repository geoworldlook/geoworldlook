"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets } from 'lucide-react';
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
  const [metricMode, setMetricMode] = useState<'ndvi' | 'ndmi' | 'both'>('both');

  if (stats.length === 0) {
    return (
      <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
            <CardTitle className="text-lg text-white">{block.name}</CardTitle>
            <p className="text-xs text-gray-500">Area: {block.area_ha} ha</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="text-center text-gray-500 text-xs py-8">
          No historical data available for this block.
        </CardContent>
      </Card>
    );
  }

  const latestData = stats[stats.length - 1];

  const chartData = stats.map(d => {
    const dateObj = new Date(d.date);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    const monthYear = `${month} ${year}`;
    return {
      ...d,
      month,
      year,
      monthYear
    };
  });

  // Filter to show one label per month-year combination on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/95 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] custom-scrollbar">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white leading-tight">{block.name}</CardTitle>
          <p className="text-xs text-gray-400 mt-0.5">Area: <span className="text-emerald-400 font-medium">{block.area_ha} ha</span></p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white shrink-0 self-start">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Latest Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" /> NDVI
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-sky-400 shrink-0" /> NDMI
            </p>
            <p className="text-lg font-bold text-sky-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-gray-400 shrink-0" /> Clouds
            </p>
            <p className="text-lg font-bold text-zinc-300">
              {latestData.cloud_cover.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Chart View Toggle Controls */}
        <div className="flex bg-white/[0.04] p-1 rounded-lg border border-white/[0.05] gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMetricMode('both')}
            className={`flex-1 text-[10px] h-7 px-2 font-semibold transition-all duration-200 ${metricMode === 'both' ? 'bg-emerald-500 text-black hover:bg-emerald-400 hover:text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Both
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMetricMode('ndvi')}
            className={`flex-1 text-[10px] h-7 px-2 font-semibold transition-all duration-200 ${metricMode === 'ndvi' ? 'bg-emerald-500 text-black hover:bg-emerald-400 hover:text-black' : 'text-gray-400 hover:text-white'}`}
          >
            NDVI
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMetricMode('ndmi')}
            className={`flex-1 text-[10px] h-7 px-2 font-semibold transition-all duration-200 ${metricMode === 'ndmi' ? 'bg-sky-500 text-black hover:bg-sky-400 hover:text-black' : 'text-gray-400 hover:text-white'}`}
          >
            NDMI
          </Button>
        </div>

        {/* Line Chart */}
        <div className="h-48 w-full bg-black/20 p-1 rounded-lg border border-white/[0.02]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={monthTicks}
                tickFormatter={(str) => {
                  const d = new Date(str);
                  return d.toLocaleDateString('en-US', { month: 'short' });
                }}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={metricMode === 'ndmi' ? [-0.5, 0.5] : metricMode === 'ndvi' ? [0, 1] : [-0.3, 1]}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px', borderRadius: '6px' }}
                itemStyle={{ fontSize: '11px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              {(metricMode === 'ndvi' || metricMode === 'both') && (
                <Line
                  type="monotone"
                  name="NDVI (Veg)"
                  dataKey="ndvi_mean"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              )}
              {(metricMode === 'ndmi' || metricMode === 'both') && (
                <Line
                  type="monotone"
                  name="NDMI (Water)"
                  dataKey="ndmi_mean"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#38bdf8' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 italic pt-1 border-t border-white/[0.05]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Last updated: {latestData.date}
          </span>
          <span>Sentinel-2 L2A</span>
        </div>
      </CardContent>
    </Card>
  );
}
