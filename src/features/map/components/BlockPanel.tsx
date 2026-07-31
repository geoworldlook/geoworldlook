"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Layers, Activity } from 'lucide-react';
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

  const latestData = block.timeSeries && block.timeSeries.length > 0
    ? block.timeSeries[block.timeSeries.length - 1]
    : null;

  const chartData = (block.timeSeries || []).map(d => {
    const dateObj = new Date(d.date);
    return {
      ...d,
      monthYear: dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      monthLabel: dateObj.toLocaleDateString('en-US', { month: 'short' })
    };
  });

  // Filter to show distinct labels even when data spans multiple calendar years
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/95 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
            <Layers className="w-3 h-3" /> Vineyard Block
          </p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-zinc-400">Area: {block.area_ha.toFixed(2)} ha</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {latestData ? (
          <>
            {/* Stats Metrics Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
                <p className="text-[9px] text-zinc-400 uppercase mb-1 flex items-center gap-1">
                  <TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> NDVI
                </p>
                <p className="text-lg font-bold text-emerald-400">
                  {latestData.ndvi_mean.toFixed(2)}
                </p>
              </div>

              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
                <p className="text-[9px] text-zinc-400 uppercase mb-1 flex items-center gap-1">
                  <Activity className="w-2.5 h-2.5 text-sky-400" /> NDMI
                </p>
                <p className="text-lg font-bold text-sky-400">
                  {latestData.ndmi_mean.toFixed(2)}
                </p>
              </div>

              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
                <p className="text-[9px] text-zinc-400 uppercase mb-1 flex items-center gap-1">
                  <Cloud className="w-2.5 h-2.5 text-zinc-400" /> Cloud
                </p>
                <p className="text-lg font-bold text-zinc-300">
                  {latestData.cloud_cover.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Toggle Visibility Buttons */}
            <div className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider mr-auto">Indices:</span>
              <button
                onClick={() => setShowNDVI(!showNDVI)}
                className={`text-[10px] px-2 py-1 rounded transition-colors font-medium border ${
                  showNDVI
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-transparent text-zinc-500 border-zinc-800'
                }`}
              >
                NDVI
              </button>
              <button
                onClick={() => setShowNDMI(!showNDMI)}
                className={`text-[10px] px-2 py-1 rounded transition-colors font-medium border ${
                  showNDMI
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                    : 'bg-transparent text-zinc-500 border-zinc-800'
                }`}
              >
                NDMI
              </button>
            </div>

            {/* Chart Area */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="date"
                    ticks={monthTicks}
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return d.toLocaleDateString('en-US', { month: 'short' });
                    }}
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[-0.5, 1.0]}
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    ticks={[-0.5, 0, 0.5, 1.0]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px', color: '#fff' }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />

                  {showNDVI && (
                    <Line
                      type="monotone"
                      name="NDVI"
                      dataKey="ndvi_mean"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#10b981' }}
                    />
                  )}

                  {showNDMI && (
                    <Line
                      type="monotone"
                      name="NDMI"
                      dataKey="ndmi_mean"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#0ea5e9' }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-zinc-500 italic">
              <Calendar className="w-3 h-3" />
              Last updated: {latestData.date}
            </div>
          </>
        ) : (
          <p className="text-xs text-zinc-500 text-center py-4">No statistical data available for this block.</p>
        )}
      </CardContent>
    </Card>
  );
}
