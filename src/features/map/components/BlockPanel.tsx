
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Droplets } from 'lucide-react';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
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
  stats: VineyardStat[];
  onClose: () => void;
}

export default function BlockPanel({ block, stats, onClose }: BlockPanelProps) {
  const [visibleIndices, setVisibleIndices] = useState({ ndvi: true, ndmi: true });
  const latestData = stats.length > 0 ? stats[stats.length - 1] : null;

  const chartData = stats.map(d => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' })
  }));

  // Filter to show one label per month on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.month === d.month))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha} ha · Polygon ID: {block.id.slice(0,8)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {latestData ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`bg-white/[0.03] p-3 rounded-lg border border-white/[0.05] cursor-pointer transition-colors ${visibleIndices.ndvi ? 'border-emerald-500/50' : ''}`}
                onClick={() => setVisibleIndices(prev => ({ ...prev, ndvi: !prev.ndvi }))}
              >
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> NDVI Mean
                </p>
                <p className="text-2xl font-bold text-emerald-400">
                  {latestData.ndvi_mean.toFixed(3)}
                </p>
              </div>
              <div
                className={`bg-white/[0.03] p-3 rounded-lg border border-white/[0.05] cursor-pointer transition-colors ${visibleIndices.ndmi ? 'border-blue-500/50' : ''}`}
                onClick={() => setVisibleIndices(prev => ({ ...prev, ndmi: !prev.ndmi }))}
              >
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> NDMI Mean
                </p>
                <p className="text-2xl font-bold text-blue-400">
                  {latestData.ndmi_mean.toFixed(3)}
                </p>
              </div>
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
                    domain={[0, 1]}
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    ticks={[0, 0.5, 1]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  {visibleIndices.ndvi && (
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
                  {visibleIndices.ndmi && (
                    <Line
                      type="monotone"
                      name="NDMI"
                      dataKey="ndmi_mean"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#3b82f6' }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center text-[10px] text-gray-500 italic">
              <div className="flex items-center gap-2">
                <Cloud className="w-3 h-3" />
                Cloud: {latestData.cloud_cover}%
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Updated: {latestData.date}
              </div>
            </div>
          </>
        ) : (
          <div className="py-10 text-center text-gray-500 text-sm">
            No satellite data available for this block.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
