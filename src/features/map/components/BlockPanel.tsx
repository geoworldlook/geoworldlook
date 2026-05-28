"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Droplets, Cloud, Calendar, Layers } from 'lucide-react';
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
  const [activeIndices, setActiveIndices] = useState<string[]>(['ndvi', 'ndmi']);

  const latestData = block.stats[block.stats.length - 1];

  const chartData = block.stats.map(d => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' })
  }));

  // Filter to show one label per month on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.month === d.month))
    .map(d => d.date);

  const toggleIndex = (index: string) => {
    setActiveIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
            <Layers className="w-3 h-3" /> Vineyard Block
          </p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha} ha • Satellite Monitoring</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {latestData ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toggleIndex('ndvi')}
                className={`p-3 rounded-lg border transition-all text-left ${
                  activeIndices.includes('ndvi')
                    ? 'bg-emerald-500/10 border-emerald-500/50'
                    : 'bg-white/[0.02] border-white/[0.05] grayscale opacity-50'
                }`}
              >
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> NDVI
                </p>
                <p className="text-xl font-bold text-emerald-400">
                  {latestData.ndvi_mean.toFixed(3)}
                </p>
              </button>

              <button
                onClick={() => toggleIndex('ndmi')}
                className={`p-3 rounded-lg border transition-all text-left ${
                  activeIndices.includes('ndmi')
                    ? 'bg-sky-500/10 border-sky-500/50'
                    : 'bg-white/[0.02] border-white/[0.05] grayscale opacity-50'
                }`}
              >
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> NDMI
                </p>
                <p className="text-xl font-bold text-sky-400">
                  {latestData.ndmi_mean.toFixed(3)}
                </p>
              </button>
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
                    itemStyle={{ fontSize: '11px' }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />

                  {activeIndices.includes('ndvi') && (
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

                  {activeIndices.includes('ndmi') && (
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

            <div className="flex items-center justify-between text-[10px] text-gray-500 italic">
              <div className="flex items-center gap-1">
                <Cloud className="w-3 h-3" /> Cloud: {latestData.cloud_cover}%
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Updated: {latestData.date}
              </div>
            </div>
          </>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-gray-500">
            <Cloud className="w-8 h-8 mb-2 opacity-20 animate-pulse" />
            <p className="text-xs uppercase tracking-widest">Awaiting Satellite Data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
