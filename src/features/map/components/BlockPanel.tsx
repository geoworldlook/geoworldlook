"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Layers } from 'lucide-react';
import { VineyardBlock } from '@/types/vineyard';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface BlockPanelProps {
  block: VineyardBlock;
  onClose: () => void;
}

export default function BlockPanel({ block, onClose }: BlockPanelProps) {
  const [showNdvi, setShowNdvi] = useState(true);
  const [showNdmi, setShowNdmi] = useState(true);

  const stats = block.stats || [];
  const latestData = stats.length > 0 ? stats[stats.length - 1] : {
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

  // Filter to show unique month-year combinations on X axis ticks
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
        {/* Toggle Controls */}
        <div className="flex gap-2 justify-center pb-2 border-b border-white/[0.05]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNdvi(!showNdvi)}
            className={cn(
              "text-xs transition-all h-8 rounded-full border px-3",
              showNdvi
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300"
                : "bg-transparent border-white/10 text-gray-500 hover:bg-white/[0.03]"
            )}
          >
            NDVI (Vegetation)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNdmi(!showNdmi)}
            className={cn(
              "text-xs transition-all h-8 rounded-full border px-3",
              showNdmi
                ? "bg-sky-500/20 border-sky-500 text-sky-400 hover:bg-sky-500/30 hover:text-sky-300"
                : "bg-transparent border-white/10 text-gray-500 hover:bg-white/[0.03]"
            )}
          >
            NDMI (Moisture)
          </Button>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05] text-center">
            <p className="text-[9px] text-gray-500 uppercase mb-0.5 flex items-center justify-center gap-1">
              <TrendingUp className="w-2.5 h-2.5 text-emerald-500" /> NDVI
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05] text-center">
            <p className="text-[9px] text-gray-500 uppercase mb-0.5 flex items-center justify-center gap-1">
              <Layers className="w-2.5 h-2.5 text-sky-500" /> NDMI
            </p>
            <p className="text-lg font-bold text-sky-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05] text-center">
            <p className="text-[9px] text-gray-500 uppercase mb-0.5 flex items-center justify-center gap-1">
              <Cloud className="w-2.5 h-2.5 text-gray-400" /> Cloud
            </p>
            <p className="text-lg font-bold text-gray-300">
              {latestData.cloud_cover}%
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="h-48 w-full bg-white/[0.01] rounded-lg p-1 border border-white/[0.02]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis
                  dataKey="date"
                  ticks={monthYearTicks}
                  tickFormatter={(str) => {
                    const d = new Date(str);
                    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                  stroke="#555"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[-0.4, 1.0]}
                  stroke="#555"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  ticks={[-0.4, 0, 0.4, 0.8]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px', borderRadius: '4px' }}
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
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#0ea5e9' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              No historical data available
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
          <Calendar className="w-3 h-3" />
          Last satellite pass: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
