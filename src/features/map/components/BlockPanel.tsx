"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Sparkles, Map } from 'lucide-react';
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
  const [indexMode, setIndexMode] = useState<'ndvi' | 'ndmi' | 'both'>('both');

  const latestData = block.timeSeries[block.timeSeries.length - 1];

  const chartData = block.timeSeries.map(d => {
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

  // Unique ticks by month-year composite key
  const uniqueTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
            <Map className="w-3 h-3" /> Vineyard Block
          </p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha.toFixed(2)} ha · Zielona Góra, PL</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Latest Stats */}
        {latestData && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
              <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> NDVI
              </p>
              <p className="text-lg font-bold text-emerald-400">
                {latestData.ndvi_mean.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
              <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-sky-400" /> NDMI
              </p>
              <p className="text-lg font-bold text-sky-400">
                {latestData.ndmi_mean.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
              <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <Cloud className="w-2.5 h-2.5 text-gray-400" /> Cloud
              </p>
              <p className="text-lg font-bold text-gray-300">
                {latestData.cloud_cover.toFixed(0)}%
              </p>
            </div>
          </div>
        )}

        {/* Index Visibility Selector */}
        <div className="flex bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.05]">
          <button
            onClick={() => setIndexMode('both')}
            className={`flex-1 text-[10px] py-1.5 rounded-md transition-all font-medium ${
              indexMode === 'both' ? 'bg-emerald-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Both Indices
          </button>
          <button
            onClick={() => setIndexMode('ndvi')}
            className={`flex-1 text-[10px] py-1.5 rounded-md transition-all font-medium ${
              indexMode === 'ndvi' ? 'bg-emerald-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            NDVI Only
          </button>
          <button
            onClick={() => setIndexMode('ndmi')}
            className={`flex-1 text-[10px] py-1.5 rounded-md transition-all font-medium ${
              indexMode === 'ndmi' ? 'bg-sky-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            NDMI Only
          </button>
        </div>

        {/* Recharts Line Chart */}
        <div className="h-48 w-full bg-white/[0.01] p-1 rounded-lg border border-white/[0.02]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={uniqueTicks}
                tickFormatter={(str) => {
                  const date = new Date(str);
                  const month = date.toLocaleDateString('en-US', { month: 'short' });
                  const year = date.getFullYear().toString().slice(-2);
                  return `${month} '${year}`;
                }}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={indexMode === 'ndmi' ? [-0.5, 0.5] : [0, 1]}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '6px', fontSize: '11px' }}
                itemStyle={{ fontSize: '11px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              {(indexMode === 'ndvi' || indexMode === 'both') && (
                <Line
                  type="monotone"
                  dataKey="ndvi_mean"
                  name="NDVI (Veg)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              )}
              {(indexMode === 'ndmi' || indexMode === 'both') && (
                <Line
                  type="monotone"
                  dataKey="ndmi_mean"
                  name="NDMI (Moist)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#38bdf8' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer info */}
        {latestData && (
          <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
            <Calendar className="w-3 h-3" />
            Last S2 acquisition: {latestData.date}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
