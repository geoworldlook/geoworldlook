"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets, Layers } from 'lucide-react';
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
  const [metricView, setMetricView] = useState<'both' | 'ndvi' | 'ndmi'>('both');
  const timeSeries = block.timeSeries || [];
  const latestData = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1] : null;

  const chartData = timeSeries.map(d => {
    const dateObj = new Date(d.date);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    return {
      ...d,
      month,
      year,
      monthYear: `${year}-${month}`
    };
  });

  // Filter to show unique month-year ticks on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          {block.area_ha && (
            <p className="text-xs text-gray-400">{block.area_ha} ha</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {latestData ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
                <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
                </p>
                <p className="text-xl font-bold text-emerald-400">
                  {latestData.ndvi_mean.toFixed(2)}
                </p>
              </div>

              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
                <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" /> NDMI
                </p>
                <p className="text-xl font-bold text-cyan-400">
                  {latestData.ndmi_mean.toFixed(2)}
                </p>
              </div>

              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
                <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-sky-400" /> Cloud
                </p>
                <p className="text-xl font-bold text-sky-400">
                  {latestData.cloud_cover}%
                </p>
              </div>
            </div>

            {/* Metric Toggle Buttons */}
            <div className="flex items-center justify-between bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
              <button
                onClick={() => setMetricView('both')}
                className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                  metricView === 'both' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                NDVI + NDMI
              </button>
              <button
                onClick={() => setMetricView('ndvi')}
                className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                  metricView === 'ndvi' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                NDVI Only
              </button>
              <button
                onClick={() => setMetricView('ndmi')}
                className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                  metricView === 'ndmi' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                NDMI Only
              </button>
            </div>

            {/* Recharts Line Chart */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="date"
                    ticks={monthTicks}
                    tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[-0.2, 1]}
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    ticks={[0, 0.5, 1]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px', borderRadius: '6px' }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
                  />
                  {(metricView === 'both' || metricView === 'ndvi') && (
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
                  {(metricView === 'both' || metricView === 'ndmi') && (
                    <Line
                      type="monotone"
                      dataKey="ndmi_mean"
                      name="NDMI"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#06b6d4' }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-500 italic pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Updated: {latestData.date}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-400" />
                Sentinel-2 L2A
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 italic py-4">No satellite telemetry data available for this block.</p>
        )}
      </CardContent>
    </Card>
  );
}
