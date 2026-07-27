"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplet } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'ndvi' | 'ndmi' | 'both'>('both');

  const stats = block.stats || [];
  const latestData = stats[stats.length - 1] || {
    date: 'N/A',
    ndvi_mean: 0,
    ndmi_mean: 0,
    cloud_cover: 0
  };

  const chartData = stats.map(d => {
    const dateObj = new Date(d.date);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    return {
      ...d,
      month,
      year,
      monthYear: `${month} ${year}`
    };
  });

  // Filter to show unique composite month-year on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  const showNdvi = viewMode === 'ndvi' || viewMode === 'both';
  const showNdmi = viewMode === 'ndmi' || viewMode === 'both';

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] max-h-[90%] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha ? `${block.area_ha.toFixed(2)} ha` : '0.00 ha'}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05] flex flex-col justify-between animate-fade-in">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {latestData.ndvi_mean ? latestData.ndvi_mean.toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05] flex flex-col justify-between animate-fade-in">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <Droplet className="w-3 h-3 text-sky-400" /> NDMI
            </p>
            <p className="text-lg font-bold text-sky-400">
              {latestData.ndmi_mean ? latestData.ndmi_mean.toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05] flex flex-col justify-between animate-fade-in">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-gray-400" /> Cloud
            </p>
            <p className="text-lg font-bold text-gray-400">
              {latestData.cloud_cover ? `${latestData.cloud_cover.toFixed(1)}%` : '0%'}
            </p>
          </div>
        </div>

        {/* Visibility Toggle */}
        <div className="flex gap-1 bg-white/[0.05] p-1 rounded-md">
          <button
            onClick={() => setViewMode('ndvi')}
            className={`flex-1 text-center py-1 text-xs font-semibold rounded-sm transition-all duration-200 ${viewMode === 'ndvi' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            NDVI
          </button>
          <button
            onClick={() => setViewMode('ndmi')}
            className={`flex-1 text-center py-1 text-xs font-semibold rounded-sm transition-all duration-200 ${viewMode === 'ndmi' ? 'bg-sky-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            NDMI
          </button>
          <button
            onClick={() => setViewMode('both')}
            className={`flex-1 text-center py-1 text-xs font-semibold rounded-sm transition-all duration-200 ${viewMode === 'both' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Both
          </button>
        </div>

        {/* Chart */}
        <div className="h-48 w-full bg-white/[0.01] rounded-lg p-1 border border-white/[0.03]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis
                  dataKey="date"
                  ticks={monthTicks}
                  tickFormatter={(str) => {
                    const dObj = new Date(str);
                    const mStr = dObj.toLocaleDateString('en-US', { month: 'short' });
                    const yStr = dObj.getFullYear().toString().slice(-2);
                    return `${mStr} '${yStr}`;
                  }}
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
                  ticks={[-0.2, 0.2, 0.6, 1.0]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                  labelStyle={{ color: '#aaa' }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                {showNdvi && (
                  <Line
                    type="monotone"
                    dataKey="ndvi_mean"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="NDVI"
                    activeDot={{ r: 4, fill: '#10b981' }}
                  />
                )}
                {showNdmi && (
                  <Line
                    type="monotone"
                    dataKey="ndmi_mean"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                    name="NDMI"
                    activeDot={{ r: 4, fill: '#0ea5e9' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              No historical data available.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
          <Calendar className="w-3 h-3" />
          Last updated: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
