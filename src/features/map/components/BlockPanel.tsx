"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Eye, EyeOff, Droplets } from 'lucide-react';
import { VineyardBlockWithStats } from '@/types/vineyard';
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
  block: VineyardBlockWithStats;
  onClose: () => void;
}

export default function BlockPanel({ block, onClose }: BlockPanelProps) {
  const [showNdvi, setShowNdvi] = useState(true);
  const [showNdmi, setShowNdmi] = useState(true);

  const stats = block.stats || [];
  const latestData = stats.length > 0 ? stats[stats.length - 1] : null;

  const chartData = stats.map(d => {
    const dateObj = new Date(d.date);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    return {
      ...d,
      monthYear: `${month} ${year}`,
      month,
      year
    };
  });

  // Filter to show one label per distinct month-year on X axis (handles multiple calendar years)
  const monthYearTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000]">
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
        {latestData ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> Current NDVI
                </p>
                <p className="text-xl font-bold text-emerald-400">
                  {latestData.ndvi_mean.toFixed(3)}
                </p>
              </div>
              <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-sky-400" /> Current NDMI
                </p>
                <p className="text-xl font-bold text-sky-400">
                  {latestData.ndmi_mean.toFixed(3)}
                </p>
              </div>
            </div>

            <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05] flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
                <Cloud className="w-3 h-3 text-sky-300" /> Cloud Cover
              </span>
              <span className="text-sm font-bold text-sky-300">
                {latestData.cloud_cover.toFixed(1)}%
              </span>
            </div>

            {/* Index visibility toggles */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNdvi(!showNdvi)}
                className={`text-[10px] h-7 px-2.5 flex items-center gap-1.5 transition-colors ${
                  showNdvi
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300'
                    : 'border-white/[0.05] bg-transparent text-gray-500 hover:bg-white/[0.03]'
                }`}
              >
                {showNdvi ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                NDVI
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNdmi(!showNdmi)}
                className={`text-[10px] h-7 px-2.5 flex items-center gap-1.5 transition-colors ${
                  showNdmi
                    ? 'border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300'
                    : 'border-white/[0.05] bg-transparent text-gray-500 hover:bg-white/[0.03]'
                }`}
              >
                {showNdmi ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                NDMI
              </Button>
            </div>

            {/* Recharts Chart */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="date"
                    ticks={monthYearTicks}
                    tickFormatter={(str) => {
                      const dateObj = new Date(str);
                      return dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                    }}
                    stroke="#666"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[-0.5, 1]}
                    stroke="#666"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    ticks={[-0.5, 0, 0.5, 1]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px' }}
                    itemStyle={{ fontSize: '11px' }}
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
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#0ea5e9' }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-500 italic pt-1">
              <Calendar className="w-3 h-3" />
              Satellite Observation Date: {latestData.date}
            </div>
          </>
        ) : (
          <div className="h-48 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
            <p className="text-xs text-gray-500">No telemetry data available for this block.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
