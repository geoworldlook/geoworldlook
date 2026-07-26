"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar } from 'lucide-react';
import { VineyardBlock, VineyardStat } from '@/lib/mock-data/vineyard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  const [showNdvi, setShowNdvi] = useState(true);
  const [showNdmi, setShowNdmi] = useState(true);

  const latestData = stats.length > 0 ? stats[stats.length - 1] : null;

  const chartData = stats.map(d => {
    const dateObj = new Date(d.date);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    return {
      ...d,
      month,
      year,
      monthYear: `${month} ${year}`
    };
  });

  // Filter ticks to show unique monthYear labels on X-axis (preventing duplicates across multiple years)
  const ticks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">Area: {block.area_ha.toFixed(2)} ha</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {latestData && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
              <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
              </p>
              <p className="text-lg font-bold text-emerald-400">
                {latestData.ndvi_mean.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
              <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-cyan-400" /> NDMI
              </p>
              <p className="text-lg font-bold text-cyan-400">
                {latestData.ndmi_mean.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
              <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <Cloud className="w-3 h-3 text-sky-400" /> Cloud
              </p>
              <p className="text-lg font-bold text-sky-400">
                {latestData.cloud_cover.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Toggle Controls */}
        <div className="flex items-center justify-between p-2 bg-white/[0.02] rounded-lg border border-white/[0.05] text-xs">
          <div className="flex items-center gap-2">
            <Switch
              id="ndvi-toggle"
              checked={showNdvi}
              onCheckedChange={setShowNdvi}
              className="data-[state=checked]:bg-emerald-500"
            />
            <Label htmlFor="ndvi-toggle" className="text-gray-300 text-[11px] cursor-pointer">NDVI (Vegetation)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="ndmi-toggle"
              checked={showNdmi}
              onCheckedChange={setShowNdmi}
              className="data-[state=checked]:bg-cyan-500"
            />
            <Label htmlFor="ndmi-toggle" className="text-gray-300 text-[11px] cursor-pointer">NDMI (Moisture)</Label>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={ticks}
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
                domain={[-1, 1]}
                stroke="#666"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                ticks={[-1, -0.5, 0, 0.5, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px' }}
                itemStyle={{ fontSize: '11px' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
              {showNdvi && (
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
              {showNdmi && (
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

        {latestData && (
          <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
            <Calendar className="w-3 h-3" />
            Last updated: {latestData.date}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
