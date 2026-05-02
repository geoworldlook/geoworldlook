
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets } from 'lucide-react';
import { VineyardBlockWithStats } from '@/types/vineyard';
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
  block: VineyardBlockWithStats;
  onClose: () => void;
}

export default function BlockPanel({ block, onClose }: BlockPanelProps) {
  const [activeMetric, setActiveMetric] = useState<'both' | 'ndvi' | 'ndmi'>('both');

  const stats = block.stats || [];
  const latestData = stats.length > 0 ? stats[stats.length - 1] : null;

  const chartData = stats.map(d => {
    const date = new Date(d.date);
    return {
      ...d,
      monthYear: `${date.getMonth()}-${date.getFullYear()}`
    };
  });

  // Filter to show one label per month on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha} ha · Area ID: {block.id.slice(0,8)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {latestData ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> NDVI (Mean)
                </p>
                <p className="text-2xl font-bold text-emerald-400">
                  {latestData.ndvi_mean.toFixed(3)}
                </p>
              </div>
              <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> NDMI (Water)
                </p>
                <p className="text-2xl font-bold text-sky-400">
                  {latestData.ndmi_mean.toFixed(3)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                className={`text-[10px] h-6 px-2 ${activeMetric === 'ndvi' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500'}`}
                onClick={() => setActiveMetric('ndvi')}
              >
                NDVI Only
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`text-[10px] h-6 px-2 ${activeMetric === 'ndmi' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-500'}`}
                onClick={() => setActiveMetric('ndmi')}
              >
                NDMI Only
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`text-[10px] h-6 px-2 ${activeMetric === 'both' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                onClick={() => setActiveMetric('both')}
              >
                Both
              </Button>
            </div>

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
                    ticks={[-0.2, 0, 0.2, 0.4, 0.6, 0.8, 1]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />

                  {(activeMetric === 'both' || activeMetric === 'ndvi') && (
                    <Line
                      name="NDVI (Vegetation)"
                      type="monotone"
                      dataKey="ndvi_mean"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#10b981' }}
                    />
                  )}

                  {(activeMetric === 'both' || activeMetric === 'ndmi') && (
                    <Line
                      name="NDMI (Moisture)"
                      type="monotone"
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

            <div className="flex items-center justify-between text-[10px] text-gray-500 italic pt-2 border-t border-white/5">
              <div className="flex items-center gap-1">
                <Cloud className="w-3 h-3" /> Cloud: {latestData.cloud_cover}%
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {latestData.date}
              </div>
            </div>
          </>
        ) : (
          <div className="py-10 text-center">
            <p className="text-gray-500 text-sm">No satellite data available for this block yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
