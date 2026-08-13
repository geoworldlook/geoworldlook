"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Layers } from 'lucide-react';
import { VineyardBlock } from '@/hooks/use-vineyard-data';
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
  const [showNDVI, setShowNDVI] = useState(true);
  const [showNDMI, setShowNDMI] = useState(true);

  const stats = block.stats || [];
  const latestData = stats.length > 0 ? stats[stats.length - 1] : null;

  const chartData = stats.map(d => {
    const dateObj = new Date(d.date);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    return {
      ...d,
      month,
      year,
      monthYear: `${month} ${year}` // Composite month-year key for X-axis filtering
    };
  });

  // Filter to show distinct labels on X axis across calendar years
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white leading-tight">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha.toFixed(2)} ha</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white shrink-0 ml-2">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {latestData ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI (Mean)
                </p>
                <p className="text-xl font-bold text-emerald-400">
                  {latestData.ndvi_mean.toFixed(2)}
                </p>
              </div>
              <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-400" /> NDMI (Mean)
                </p>
                <p className="text-xl font-bold text-cyan-400">
                  {latestData.ndmi_mean.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05] flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
                <Cloud className="w-3 h-3 text-sky-400" /> Cloud Cover
              </span>
              <span className="text-sm font-semibold text-sky-400">
                {latestData.cloud_cover}%
              </span>
            </div>

            {/* Toggle options to view indices */}
            <div className="flex items-center justify-between px-1 py-2 bg-white/[0.02] rounded-lg border border-white/[0.03] text-xs space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ndvi-toggle"
                  checked={showNDVI}
                  onCheckedChange={setShowNDVI}
                />
                <Label htmlFor="ndvi-toggle" className="text-[10px] text-gray-400 uppercase cursor-pointer">NDVI</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ndmi-toggle"
                  checked={showNDMI}
                  onCheckedChange={setShowNDMI}
                />
                <Label htmlFor="ndmi-toggle" className="text-[10px] text-gray-400 uppercase cursor-pointer">NDMI</Label>
              </div>
            </div>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="date"
                    ticks={monthTicks}
                    tickFormatter={(str) => {
                      const dateObj = new Date(str);
                      return dateObj.toLocaleDateString('en-US', { month: 'short' });
                    }}
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
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '11px', borderRadius: '6px' }}
                    itemStyle={{ fontSize: '11px' }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  {showNDVI && (
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
                  {showNDMI && (
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

            <div className="flex items-center gap-2 text-[10px] text-gray-500 italic pt-2">
              <Calendar className="w-3 h-3" />
              Sensing date: {latestData.date}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500 text-xs">
            No historical telemetry available for this block.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
