"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Waves } from 'lucide-react';
import { VineyardBlock } from '@/types/vineyards';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  const [showNdvi, setShowNdvi] = useState(true);
  const [showNdmi, setShowNdmi] = useState(true);

  const series = block.timeSeries || [];
  const latestData = series[series.length - 1];

  const chartData = series.map(d => {
    const dateObj = new Date(d.date);
    return {
      ...d,
      month: dateObj.toLocaleDateString('en-US', { month: 'short' }),
      // composite key to ensure unique tick filtering over multi-year ranges
      monthYear: `${dateObj.getMonth()}-${dateObj.getFullYear()}`
    };
  });

  // Filter to show one label per distinct month-year
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] max-h-[90%] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">Area: {block.area_ha?.toFixed(2)} ha</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {latestData ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
              <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> NDVI Mean
              </p>
              <p className="text-2xl font-bold text-emerald-400">
                {latestData.ndvi_mean?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
              <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                <Waves className="w-3 h-3" /> NDMI Mean
              </p>
              <p className="text-2xl font-bold text-sky-400">
                {latestData.ndmi_mean?.toFixed(2)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">No recent telemetries available.</p>
        )}

        {/* Visibility Toggles */}
        <div className="flex items-center justify-between gap-4 py-2 border-y border-white/[0.05]">
          <div className="flex items-center space-x-2">
            <Switch
              id="toggle-ndvi"
              checked={showNdvi}
              onCheckedChange={setShowNdvi}
            />
            <Label htmlFor="toggle-ndvi" className="text-xs text-gray-300">NDVI</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="toggle-ndmi"
              checked={showNdmi}
              onCheckedChange={setShowNdmi}
            />
            <Label htmlFor="toggle-ndmi" className="text-xs text-gray-300">NDMI</Label>
          </div>
        </div>

        {series.length > 0 && (showNdvi || showNdmi) ? (
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
                  domain={[-1, 1]}
                  stroke="#666"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  ticks={[-1, -0.5, 0, 0.5, 1]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                  labelStyle={{ color: '#aaa' }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                {showNdvi && (
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
                {showNdmi && (
                  <Line
                    type="monotone"
                    dataKey="ndmi_mean"
                    name="NDMI"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#38bdf8' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 w-full flex items-center justify-center bg-white/[0.01] rounded-lg border border-dashed border-white/[0.05]">
            <p className="text-xs text-gray-500">Toggle index to display historical trends</p>
          </div>
        )}

        {latestData && (
          <div className="flex items-center justify-between text-[10px] text-gray-500 italic">
            <span className="flex items-center gap-2">
              <Cloud className="w-3 h-3 text-sky-400" />
              Cloud cover: {latestData.cloud_cover?.toFixed(1)}%
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Observed: {latestData.date}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
