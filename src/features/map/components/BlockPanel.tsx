"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Layers } from 'lucide-react';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';
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
  stats: VineyardStats[];
  loading: boolean;
  onClose: () => void;
}

export default function BlockPanel({ block, stats, loading, onClose }: BlockPanelProps) {
  const [activeIndices, setActiveIndices] = useState<'ndvi' | 'ndmi' | 'both'>('both');

  const latestData = stats.length > 0 ? stats[stats.length - 1] : null;

  const chartData = stats.map(d => {
    const dateObj = new Date(d.date);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    return {
      ...d,
      month,
      monthYear: `${month} ${year}` // Composite month-year key for deduplication
    };
  });

  // Filter to show one label per distinct month-year on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.monthYear === d.monthYear))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 max-h-[90%] overflow-y-auto shadow-2xl border-white/[0.1] bg-black/90 backdrop-blur-md animate-in slide-in-from-right duration-300 z-[1000] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-white/[0.05]">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Vineyard Block</p>
          <CardTitle className="text-lg text-white font-semibold">{block.name}</CardTitle>
          <p className="text-xs text-gray-500">{block.area_ha.toFixed(2)} ha</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs text-gray-500 uppercase tracking-wider">Loading block stats...</p>
            </div>
          </div>
        ) : latestData ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
                <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI
                </p>
                <p className="text-lg font-bold text-emerald-400">
                  {latestData.ndvi_mean.toFixed(2)}
                </p>
              </div>
              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
                <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-sky-400" /> NDMI
                </p>
                <p className="text-lg font-bold text-sky-400">
                  {latestData.ndmi_mean.toFixed(2)}
                </p>
              </div>
              <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] flex flex-col justify-between">
                <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-gray-400" /> Cloud
                </p>
                <p className="text-lg font-bold text-gray-300">
                  {latestData.cloud_cover}%
                </p>
              </div>
            </div>

            {/* Metric Toggle */}
            <div className="flex bg-white/[0.03] p-1 rounded-lg border border-white/[0.05] justify-between text-xs gap-1">
              <button
                onClick={() => setActiveIndices('ndvi')}
                className={`flex-1 py-1 px-2 rounded-md transition-all text-center ${activeIndices === 'ndvi' ? 'bg-emerald-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                NDVI
              </button>
              <button
                onClick={() => setActiveIndices('ndmi')}
                className={`flex-1 py-1 px-2 rounded-md transition-all text-center ${activeIndices === 'ndmi' ? 'bg-sky-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                NDMI
              </button>
              <button
                onClick={() => setActiveIndices('both')}
                className={`flex-1 py-1 px-2 rounded-md transition-all text-center ${activeIndices === 'both' ? 'bg-white/15 text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                Both
              </button>
            </div>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="date"
                    ticks={monthTicks}
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                    }}
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[-0.3, 1.0]}
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    ticks={[-0.2, 0.2, 0.6, 1.0]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                    itemStyle={{ fontSize: '11px' }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />

                  {(activeIndices === 'ndvi' || activeIndices === 'both') && (
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
                  {(activeIndices === 'ndmi' || activeIndices === 'both') && (
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

            <div className="flex items-center gap-2 text-[10px] text-gray-500 italic border-t border-white/[0.05] pt-3">
              <Calendar className="w-3 h-3" />
              Last updated: {latestData.date}
            </div>
          </>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-xs text-gray-500 italic">No telemetry data available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
