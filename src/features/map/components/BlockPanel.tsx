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
  const [showNdvi, setShowNdvi] = useState(true);
  const [showNdmi, setShowNdmi] = useState(true);

  if (!block.timeSeries || block.timeSeries.length === 0) {
    return null;
  }

  const latestData = block.timeSeries[block.timeSeries.length - 1];

  const chartData = block.timeSeries.map(d => {
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

  // Filter to show unique monthYear labels on X axis
  const monthYearTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
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
        {/* Latest Readings Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-0.5 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-[#8ee6c4]" /> NDMI
            </p>
            <p className="text-lg font-bold text-[#8ee6c4]">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-500 uppercase mb-0.5 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-sky-400" /> Cloud
            </p>
            <p className="text-lg font-bold text-sky-400">
              {latestData.cloud_cover.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Index Toggles */}
        <div className="flex gap-2 justify-end pb-1 border-b border-white/[0.05]">
          <button
            onClick={() => setShowNdvi(!showNdvi)}
            className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all duration-200 ${
              showNdvi
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-400'
            }`}
          >
            NDVI (Veg)
          </button>
          <button
            onClick={() => setShowNdmi(!showNdmi)}
            className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all duration-200 ${
              showNdmi
                ? 'bg-[#8ee6c4]/10 border-[#8ee6c4]/30 text-[#8ee6c4]'
                : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-400'
            }`}
          >
            NDMI (Moisture)
          </button>
        </div>

        {/* Chart View */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={monthYearTicks}
                tickFormatter={(str) => {
                  const d = new Date(str);
                  return `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getFullYear().toString().slice(-2)}`;
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
                ticks={[-1.0, -0.5, 0, 0.5, 1.0]}
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
                  name="NDVI (Vegetation)"
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
                  name="NDMI (Moisture)"
                  stroke="#8ee6c4"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#8ee6c4' }}
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
