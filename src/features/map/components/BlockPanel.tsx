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

  const series = block.timeSeries || [];
  const latestData = series.length > 0 ? series[series.length - 1] : null;

  const chartData = series.map(d => {
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

  // Filter to show one label per monthYear combination on X axis
  const monthYearTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha ? `${block.area_ha} ha` : ''}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {latestData ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
              <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> NDVI
              </p>
              <p className="text-lg font-bold text-emerald-400">
                {latestData.ndvi_mean.toFixed(3)}
              </p>
            </div>
            <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
              <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <Droplets className="w-2.5 h-2.5 text-sky-400" /> NDMI
              </p>
              <p className="text-lg font-bold text-sky-400">
                {latestData.ndmi_mean.toFixed(3)}
              </p>
            </div>
            <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
              <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <Cloud className="w-2.5 h-2.5 text-sky-300" /> Cloud
              </p>
              <p className="text-lg font-bold text-sky-300">
                {latestData.cloud_cover.toFixed(1)}%
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-xs text-gray-500">No telemetries available.</div>
        )}

        {/* Visibility Toggles */}
        <div className="flex gap-4 pt-1">
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showNDVI}
              onChange={(e) => setShowNDVI(e.target.checked)}
              className="rounded border-white/10 bg-white/[0.03] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              NDVI (Vegetation)
            </span>
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showNDMI}
              onChange={(e) => setShowNDMI(e.target.checked)}
              className="rounded border-white/10 bg-white/[0.03] text-sky-500 focus:ring-sky-500 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
              NDMI (Moisture)
            </span>
          </label>
        </div>

        {chartData.length > 0 && (showNDVI || showNDMI) ? (
          <div className="h-48 w-full pt-1">
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
                  domain={[-1.0, 1.0]}
                  stroke="#666"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  ticks={[-1.0, -0.5, 0, 0.5, 1.0]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px' }}
                  itemStyle={{ color: '#10b981' }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                {showNDVI && (
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
                {showNDMI && (
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
        ) : (
          <div className="h-48 w-full flex items-center justify-center text-xs text-gray-500 italic bg-white/[0.01] rounded-lg border border-white/[0.03]">
            {chartData.length === 0 ? "No time-series data" : "Select an index to display chart"}
          </div>
        )}

        {latestData && (
          <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
            <Calendar className="w-3 h-3" />
            Last updated: {latestData.date}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
