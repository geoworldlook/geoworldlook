"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Layers } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface VineyardStat {
  block_id: string;
  date: string;
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

interface BlockPanelProps {
  block: {
    id: string;
    name: string;
    area_ha: number;
  };
  stats: VineyardStat[];
  onClose: () => void;
}

export default function BlockPanel({ block, stats, onClose }: BlockPanelProps) {
  const [visibleIndex, setVisibleIndex] = useState<'ndvi' | 'ndmi' | 'both'>('both');

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
      monthYear: `${dateObj.getMonth()}-${dateObj.getFullYear()}`
    };
  });

  // Filter to show one label per month-year combination
  const monthYearTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] custom-scrollbar">
      {/* Inject custom scrollbar style directly into the component */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}} />

      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">Area: {block.area_ha.toFixed(2)} ha</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
            <p className="text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> Mean NDVI
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(3)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
            <p className="text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" /> Mean NDMI
            </p>
            <p className="text-xl font-bold text-cyan-400">
              {latestData.ndmi_mean.toFixed(3)}
            </p>
          </div>
        </div>

        <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05] flex justify-between items-center">
          <p className="text-[10px] text-gray-400 uppercase flex items-center gap-1">
            <Cloud className="w-3 h-3 text-sky-400" /> Cloud Cover
          </p>
          <p className="text-sm font-bold text-sky-400">
            {latestData.cloud_cover.toFixed(1)}%
          </p>
        </div>

        {/* Index Selector / Toggle */}
        <div className="space-y-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Toggle Metrics Visibility</p>
          <div className="grid grid-cols-3 gap-1 bg-white/[0.05] p-1 rounded-lg">
            <Button
              size="sm"
              variant={visibleIndex === 'both' ? 'secondary' : 'ghost'}
              className="text-[10px] h-7 px-1"
              onClick={() => setVisibleIndex('both')}
            >
              Both
            </Button>
            <Button
              size="sm"
              variant={visibleIndex === 'ndvi' ? 'secondary' : 'ghost'}
              className="text-[10px] h-7 px-1 text-emerald-400 hover:text-emerald-300"
              onClick={() => setVisibleIndex('ndvi')}
            >
              NDVI Only
            </Button>
            <Button
              size="sm"
              variant={visibleIndex === 'ndmi' ? 'secondary' : 'ghost'}
              className="text-[10px] h-7 px-1 text-cyan-400 hover:text-cyan-300"
              onClick={() => setVisibleIndex('ndmi')}
            >
              NDMI Only
            </Button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 w-full bg-white/[0.01] rounded-lg p-1 border border-white/[0.02]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={monthYearTicks}
                tickFormatter={(str) => {
                  const d = new Date(str);
                  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                }}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[-1, 1]}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                ticks={[-1, -0.5, 0, 0.5, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              {(visibleIndex === 'both' || visibleIndex === 'ndvi') && (
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
              {(visibleIndex === 'both' || visibleIndex === 'ndmi') && (
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

        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic pt-1 border-t border-white/[0.05]">
          <Calendar className="w-3 h-3" />
          Last updated: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
