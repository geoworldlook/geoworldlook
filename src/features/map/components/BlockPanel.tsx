"use client"

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
  const [chartView, setChartView] = useState<'ndvi' | 'ndmi' | 'both'>('both');

  const timeSeries = block.timeSeries || [];
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
      monthYear,
      month
    };
  });

  // Filter to show unique month-year labels on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] max-h-[90%] overflow-y-auto custom-scrollbar">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha ? `${block.area_ha.toFixed(2)} ha` : 'N/A'}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05] text-center">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
            </p>
            <p className="text-base font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05] text-center">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center justify-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" /> NDMI
            </p>
            <p className="text-base font-bold text-cyan-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05] text-center">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center justify-center gap-1">
              <Cloud className="w-3 h-3 text-sky-400" /> Cloud
            </p>
            <p className="text-base font-bold text-sky-400">
              {latestData.cloud_cover}%
            </p>
          </div>
        </div>

        {/* Chart Visibility Toggle */}
        <div className="flex justify-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
          <button
            onClick={() => setChartView('ndvi')}
            className={`flex-1 text-[10px] py-1 rounded font-medium transition-all ${
              chartView === 'ndvi'
                ? 'bg-emerald-500 text-black font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            NDVI
          </button>
          <button
            onClick={() => setChartView('ndmi')}
            className={`flex-1 text-[10px] py-1 rounded font-medium transition-all ${
              chartView === 'ndmi'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            NDMI
          </button>
          <button
            onClick={() => setChartView('both')}
            className={`flex-1 text-[10px] py-1 rounded font-medium transition-all ${
              chartView === 'both'
                ? 'bg-white/20 text-white font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            Both
          </button>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={monthTicks}
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
                domain={[-0.3, 1]}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                ticks={[-0.2, 0.1, 0.4, 0.7, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px' }}
                itemStyle={{ fontSize: '11px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />

              {(chartView === 'ndvi' || chartView === 'both') && (
                <Line
                  name="NDVI"
                  type="monotone"
                  dataKey="ndvi_mean"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              )}

              {(chartView === 'ndmi' || chartView === 'both') && (
                <Line
                  name="NDMI"
                  type="monotone"
                  dataKey="ndmi_mean"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#06b6d4' }}
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
