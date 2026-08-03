"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Layers } from 'lucide-react';
import { VineyardBlock } from '@/types/vineyard';
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

  const latestData = block.timeSeries.length > 0
    ? block.timeSeries[block.timeSeries.length - 1]
    : { ndvi_mean: 0, ndmi_mean: 0, cloud_cover: 0, date: 'N/A' };

  // Format data for chart
  const chartData = block.timeSeries.map(d => {
    const dateObj = new Date(d.date);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    return {
      ...d,
      month,
      year,
      monthYear: `${month} ${year}` // unique composite key for year deduplication
    };
  });

  // Filter labels to show unique month-year ticks on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] max-h-[90%] overflow-y-auto custom-scrollbar">
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
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI Mean
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
            <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-sky-400" /> NDMI Mean
            </p>
            <p className="text-xl font-bold text-sky-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
          <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
            <Cloud className="w-3 h-3 text-gray-400" /> Cloud Cover
          </p>
          <p className="text-lg font-bold text-gray-300">
            {latestData.cloud_cover}%
          </p>
        </div>

        {/* Index Toggles */}
        <div className="flex gap-2 justify-start items-center text-xs pt-1">
          <button
            onClick={() => setShowNdvi(!showNdvi)}
            className={`px-2.5 py-1 rounded border transition-all ${
              showNdvi
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-semibold'
                : 'border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            NDVI
          </button>
          <button
            onClick={() => setShowNdmi(!showNdmi)}
            className={`px-2.5 py-1 rounded border transition-all ${
              showNdmi
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-400 font-semibold'
                : 'border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            NDMI (Moisture)
          </button>
        </div>

        {/* Chart */}
        <div className="h-48 w-full mt-2">
          {block.timeSeries.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center border border-dashed border-white/10 rounded-lg text-xs text-gray-500">
              No historical data available
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
                    const m = dateObj.toLocaleDateString('en-US', { month: 'short' });
                    const y = dateObj.getFullYear().toString().slice(-2);
                    return `${m} '${y}`;
                  }}
                  stroke="#666"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[-1, 1]}
                  stroke="#666"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  ticks={[-1, -0.5, 0, 0.5, 1]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px' }}
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
                    strokeWidth={1.8}
                    dot={false}
                    activeDot={{ r: 4, fill: '#0ea5e9' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic pt-2 border-t border-white/[0.05]">
          <Calendar className="w-3 h-3" />
          Last updated: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
