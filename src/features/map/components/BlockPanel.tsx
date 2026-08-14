"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets } from 'lucide-react';
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
  const [showNDVI, setShowNDVI] = useState(true);
  const [showNDMI, setShowNDMI] = useState(true);

  const stats = block.timeSeries || [];
  const latestData = stats[stats.length - 1] || {
    ndvi_mean: 0,
    ndmi_mean: 0,
    cloud_cover: 0,
    date: 'N/A'
  };

  const chartData = stats.map(d => {
    const dateObj = new Date(d.date);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    return {
      ...d,
      month,
      year,
      monthYear: `${month} ${year}` // composite month-year key for deduplication
    };
  });

  // Filter to show one label per distinct monthYear on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] max-h-[90%] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          {block.area_ha && (
            <p className="text-xs text-gray-500">Area: {block.area_ha} ha</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Latest Metric Badges */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {latestData.ndvi_mean ? latestData.ndvi_mean.toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-sky-400" /> NDMI
            </p>
            <p className="text-lg font-bold text-sky-400">
              {latestData.ndmi_mean ? latestData.ndmi_mean.toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-zinc-400" /> Cloud
            </p>
            <p className="text-lg font-bold text-zinc-300">
              {latestData.cloud_cover ? `${latestData.cloud_cover.toFixed(0)}%` : '0%'}
            </p>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Toggle Trends</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNDVI(!showNDVI)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-200 border ${
                showNDVI
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-transparent border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              NDVI (Veg)
            </button>
            <button
              onClick={() => setShowNDMI(!showNDMI)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-200 border ${
                showNDMI
                  ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                  : 'bg-transparent border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              NDMI (Moist)
            </button>
          </div>
        </div>

        {/* Recharts Timeline */}
        <div className="h-48 w-full bg-white/[0.01] rounded-lg border border-white/[0.03] p-2">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
              No historical data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis
                  dataKey="date"
                  ticks={monthTicks}
                  tickFormatter={(str) => {
                    const dateObj = new Date(str);
                    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                    const year = dateObj.getFullYear().toString().slice(-2);
                    return `${month} '${year}`;
                  }}
                  stroke="#666"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[-0.3, 1.0]}
                  stroke="#666"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  ticks={[-0.2, 0.2, 0.6, 1.0]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px', borderRadius: '6px' }}
                  labelStyle={{ color: '#aaa', fontWeight: 'bold' }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                {showNDVI && (
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
                {showNDMI && (
                  <Line
                    type="monotone"
                    dataKey="ndmi_mean"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                    name="NDMI"
                    activeDot={{ r: 4, fill: '#38bdf8' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
          <Calendar className="w-3 h-3" />
          Last updated: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
