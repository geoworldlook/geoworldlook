"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Droplets, Cloud, Calendar, Layers } from 'lucide-react';
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
  const [activeMetric, setActiveMetric] = useState<'both' | 'ndvi' | 'ndmi'>('both');
  const timeSeries = block.timeSeries || [];
  const latestData = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1] : null;

  const chartData = timeSeries.map(d => ({
    ...d,
    monthYear: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    monthLabel: new Date(d.date).toLocaleDateString('en-US', { month: 'short' })
  }));

  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] max-h-[90%] overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
            <Layers className="w-3 h-3" /> Vineyard Block
          </p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-400">Area: {block.area_ha} ha</p>
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
                <p className="text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
                </p>
                <p className="text-xl font-bold text-emerald-400">
                  {latestData.ndvi_mean.toFixed(2)}
                </p>
              </div>

              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
                <p className="text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-teal-400" /> NDMI
                </p>
                <p className="text-xl font-bold text-teal-400">
                  {latestData.ndmi_mean.toFixed(2)}
                </p>
              </div>

              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
                <p className="text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-sky-400" /> Cloud
                </p>
                <p className="text-xl font-bold text-sky-400">
                  {latestData.cloud_cover}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Chart Display:</span>
              <div className="flex items-center gap-1">
                <Button
                  variant={activeMetric === 'both' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveMetric('both')}
                  className="h-6 text-[10px] px-2 py-0"
                >
                  Both
                </Button>
                <Button
                  variant={activeMetric === 'ndvi' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveMetric('ndvi')}
                  className="h-6 text-[10px] px-2 py-0 text-emerald-400 border-emerald-500/30"
                >
                  NDVI
                </Button>
                <Button
                  variant={activeMetric === 'ndmi' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveMetric('ndmi')}
                  className="h-6 text-[10px] px-2 py-0 text-teal-400 border-teal-500/30"
                >
                  NDMI
                </Button>
              </div>
            </div>

            <div className="h-48 w-full pt-1">
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
                    domain={[-0.2, 1.0]}
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    ticks={[-0.2, 0, 0.4, 0.8]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />

                  {(activeMetric === 'both' || activeMetric === 'ndvi') && (
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

                  {(activeMetric === 'both' || activeMetric === 'ndmi') && (
                    <Line
                      type="monotone"
                      dataKey="ndmi_mean"
                      name="NDMI (Moisture)"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#14b8a6' }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-500 italic pt-1">
              <Calendar className="w-3 h-3" />
              Last updated: {latestData.date}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 py-4 text-center">No telemetry data recorded for this block.</p>
        )}
      </CardContent>
    </Card>
  );
}
