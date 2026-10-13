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
  const [viewMetric, setViewMetric] = useState<'both' | 'ndvi' | 'ndmi'>('both');

  const timeSeries = block.timeSeries || [];
  const latestData = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1] : {
    ndvi_mean: 0,
    ndmi_mean: 0,
    cloud_cover: 0,
    date: 'N/A'
  };

  const chartData = timeSeries.map(d => {
    const dt = new Date(d.date);
    return {
      ...d,
      monthYear: `${dt.getFullYear()}-${dt.getMonth() + 1}`,
      formattedMonth: dt.toLocaleDateString('en-US', { month: 'short' })
    };
  });

  // Filter to show distinct month ticks
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Działka Winnicy</p>
          <CardTitle className="text-lg text-white font-semibold">{block.properties.name}</CardTitle>
          <p className="text-xs text-gray-400">Powierzchnia: {block.properties.area_ha} ha</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Indicators Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>

          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-cyan-400" /> NDMI
            </p>
            <p className="text-lg font-bold text-cyan-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>

          <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
            <p className="text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-sky-400" /> Chmury
            </p>
            <p className="text-lg font-bold text-sky-400">
              {latestData.cloud_cover}%
            </p>
          </div>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center justify-between bg-white/[0.02] p-1.5 rounded-lg border border-white/[0.05]">
          <span className="text-[10px] text-gray-400 font-medium px-2 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Wskaźnik:
          </span>
          <div className="flex gap-1">
            <Button
              variant={viewMetric === 'both' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMetric('both')}
              className="h-6 text-[10px] px-2 py-0"
            >
              Oba
            </Button>
            <Button
              variant={viewMetric === 'ndvi' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMetric('ndvi')}
              className="h-6 text-[10px] px-2 py-0 text-emerald-400"
            >
              NDVI
            </Button>
            <Button
              variant={viewMetric === 'ndmi' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMetric('ndmi')}
              className="h-6 text-[10px] px-2 py-0 text-cyan-400"
            >
              NDMI
            </Button>
          </div>
        </div>

        {/* Chart */}
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
                domain={[-0.2, 1]}
                stroke="#666"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                ticks={[-0.2, 0, 0.5, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px', borderRadius: '6px' }}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
              />
              {(viewMetric === 'both' || viewMetric === 'ndvi') && (
                <Line
                  name="NDVI (Wegetacja)"
                  type="monotone"
                  dataKey="ndvi_mean"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              )}
              {(viewMetric === 'both' || viewMetric === 'ndmi') && (
                <Line
                  name="NDMI (Wilgotność)"
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

        <div className="flex items-center justify-between text-[10px] text-gray-500 italic pt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Ostatnia zmiana: {latestData.date}
          </span>
          <span>Sentinel-2 L2A</span>
        </div>
      </CardContent>
    </Card>
  );
}
