"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets } from 'lucide-react';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';
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
  timeSeries: VineyardStats[];
  onClose: () => void;
}

export default function BlockPanel({ block, timeSeries, onClose }: BlockPanelProps) {
  const [showNDVI, setShowNDVI] = useState(true);
  const [showNDMI, setShowNDMI] = useState(true);

  const latestData = timeSeries[timeSeries.length - 1] || {
    ndvi_mean: 0,
    ndmi_mean: 0,
    cloud_cover: 0,
    date: 'N/A'
  };

  const chartData = timeSeries.map(d => {
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

  // Filter to show unique monthYear values on the X-axis
  const uniqueTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">Area: {block.area_ha?.toFixed(2)} ha</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-0.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> NDVI
            </p>
            <p className="text-base font-bold text-emerald-400">
              {latestData.ndvi_mean?.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-0.5 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-indigo-400" /> NDMI
            </p>
            <p className="text-base font-bold text-indigo-400">
              {latestData.ndmi_mean?.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-0.5 flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-sky-400" /> Clouds
            </p>
            <p className="text-base font-bold text-sky-400">
              {latestData.cloud_cover?.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Chart Visibility Toggles */}
        <div className="flex items-center gap-4 border-y border-white/[0.05] py-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showNDVI}
              onChange={(e) => setShowNDVI(e.target.checked)}
              className="accent-emerald-500 w-3.5 h-3.5 rounded border-gray-700 bg-black/50"
            />
            <span>NDVI</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showNDMI}
              onChange={(e) => setShowNDMI(e.target.checked)}
              className="accent-indigo-500 w-3.5 h-3.5 rounded border-gray-700 bg-black/50"
            />
            <span>NDMI</span>
          </label>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={uniqueTicks}
                tickFormatter={(str) => {
                  const dObj = new Date(str);
                  return dObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                }}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[-0.2, 1.0]}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                ticks={[-0.2, 0.2, 0.6, 1.0]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px' }}
                itemStyle={{ fontSize: '11px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              {showNDVI && (
                <Line
                  type="monotone"
                  dataKey="ndvi_mean"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                  name="NDVI"
                />
              )}
              {showNDMI && (
                <Line
                  type="monotone"
                  dataKey="ndmi_mean"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#6366f1' }}
                  name="NDMI"
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
