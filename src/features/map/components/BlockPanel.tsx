"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Activity } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'both' | 'ndvi' | 'ndmi'>('both');

  const timeSeries = block.timeSeries || [];
  const latestData = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1] : {
    ndvi_mean: 0,
    ndmi_mean: 0,
    cloud_cover: 0,
    date: 'N/A'
  };

  const chartData = timeSeries.map(d => {
    const dateObj = new Date(d.date);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    return {
      ...d,
      month,
      monthYear: `${month} ${year}` // Composite key for deduplication across multiple years
    };
  });

  // Filter to show unique monthYear labels on X axis
  const monthYearTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] max-h-[90%] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha ? `${block.area_ha.toFixed(2)} ha` : 'N/A'}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05] flex flex-col justify-between">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> NDVI
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {latestData.ndvi_mean ? latestData.ndvi_mean.toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05] flex flex-col justify-between">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Activity className="w-2.5 h-2.5 text-sky-400" /> NDMI
            </p>
            <p className="text-lg font-bold text-sky-400">
              {latestData.ndmi_mean ? latestData.ndmi_mean.toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05] flex flex-col justify-between">
            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Cloud className="w-2.5 h-2.5 text-gray-400" /> Cloud
            </p>
            <p className="text-lg font-bold text-gray-300">
              {latestData.cloud_cover !== undefined ? `${latestData.cloud_cover}%` : '0%'}
            </p>
          </div>
        </div>

        {/* Index Selector Tab */}
        <div className="flex bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
          <button
            onClick={() => setActiveTab('both')}
            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${activeTab === 'both' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Both Indices
          </button>
          <button
            onClick={() => setActiveTab('ndvi')}
            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${activeTab === 'ndvi' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            NDVI Only
          </button>
          <button
            onClick={() => setActiveTab('ndmi')}
            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${activeTab === 'ndmi' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            NDMI Only
          </button>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={monthYearTicks}
                tickFormatter={(str) => {
                  const dateObj = new Date(str);
                  return dateObj.toLocaleDateString('en-US', { month: 'short' });
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

              {(activeTab === 'both' || activeTab === 'ndvi') && (
                <Line
                  type="monotone"
                  dataKey="ndvi_mean"
                  name="NDVI (Veg)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              )}

              {(activeTab === 'both' || activeTab === 'ndmi') && (
                <Line
                  type="monotone"
                  dataKey="ndmi_mean"
                  name="NDMI (Moist)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#38bdf8' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
          <Calendar className="w-3 h-3" />
          Last updated: {latestData.date}
        </div>
      </CardContent>
    </Card>
  );
}
