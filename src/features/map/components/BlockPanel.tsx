"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Layers, Droplet } from 'lucide-react';
import { VineyardBlock } from '@/types/vineyard';
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

  const latestData = block.timeSeries[block.timeSeries.length - 1] || {
    ndvi_mean: 0,
    ndmi_mean: 0,
    cloud_cover: 0,
    date: 'N/A'
  };

  const chartData = block.timeSeries.map(d => {
    const dateObj = new Date(d.date);
    return {
      ...d,
      month: dateObj.toLocaleDateString('en-US', { month: 'short' }),
      monthYear: `${dateObj.getFullYear()}-${dateObj.getMonth()}` // composite key for year preservation
    };
  });

  // Filter to show distinct labels per month/year
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] custom-scrollbar">
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
        {/* Toggle controls */}
        <div className="flex gap-2 mb-2">
          <Button
            variant={showNdvi ? "default" : "outline"}
            size="sm"
            onClick={() => setShowNdvi(!showNdvi)}
            className={`text-xs px-2.5 py-1 h-auto ${showNdvi ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-gray-400 border-white/10 hover:bg-white/5'}`}
          >
            NDVI
          </Button>
          <Button
            variant={showNdmi ? "default" : "outline"}
            size="sm"
            onClick={() => setShowNdmi(!showNdmi)}
            className={`text-xs px-2.5 py-1 h-auto ${showNdmi ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-400 border-white/10 hover:bg-white/5'}`}
          >
            NDMI (Moisture)
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
            <p className="text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> Mean NDVI
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {latestData.ndvi_mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
            <p className="text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
              <Droplet className="w-3 h-3 text-blue-400" /> Mean NDMI
            </p>
            <p className="text-xl font-bold text-blue-400">
              {latestData.ndmi_mean.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.03] flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1"><Cloud className="w-3.5 h-3.5 text-sky-400" /> Cloud Cover:</span>
          <span className="font-semibold text-white">{latestData.cloud_cover}%</span>
        </div>

        <div className="h-44 w-full">
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
                domain={[-0.5, 1]}
                stroke="#666"
                fontSize={10}
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
                  stroke="#3b82f6"
                  strokeWidth={1.8}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
          <Calendar className="w-3 h-3" />
          Last satellite scan: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
