'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sprout, Droplets, Cloud, Info } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { VineyardBlockProperties, VineyardStats } from '@/types/database.types';

interface BlockPanelProps {
  block: {
    properties: VineyardBlockProperties;
    stats: VineyardStats[];
  };
  onClose: () => void;
}

export default function BlockPanel({ block, onClose }: BlockPanelProps) {
  const [metricView, setMetricView] = useState<'both' | 'ndvi' | 'ndmi'>('both');

  const { properties, stats } = block;
  const latestData = stats.length > 0 ? stats[stats.length - 1] : null;

  const chartData = stats.map(d => {
    const [year, month] = d.date.split('-');
    const dateObj = new Date(d.date);
    const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
    return {
      date: d.date,
      displayDate: `${monthShort} '${year.slice(2)}`,
      monthYear: `${year}-${month}`,
      ndvi: Number(d.ndvi_mean),
      ndmi: Number(d.ndmi_mean),
      cloud: Number(d.cloud_cover)
    };
  });

  return (
    <div className="absolute top-4 right-4 z-20 w-80 sm:w-96 max-h-[90%] overflow-y-auto">
      <Card className="bg-[#111111]/95 border-emerald-500/30 backdrop-blur-md shadow-2xl text-white">
        <CardHeader className="flex flex-row items-start justify-between pb-2 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
              <Sprout className="w-3 h-3" /> Vineyard Block
            </div>
            <CardTitle className="text-base font-bold text-white leading-tight">{properties.name}</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">
              Area: <span className="text-emerald-400 font-medium">{properties.area_ha} ha</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {latestData ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-400 font-medium mb-1">
                  <Sprout className="w-3.5 h-3.5" /> NDVI
                </div>
                <div className="text-lg font-bold text-emerald-300">{Number(latestData.ndvi_mean).toFixed(2)}</div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wider">Vegetation</div>
              </div>

              <div className="bg-blue-950/30 border border-blue-500/20 rounded-lg p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-blue-400 font-medium mb-1">
                  <Droplets className="w-3.5 h-3.5" /> NDMI
                </div>
                <div className="text-lg font-bold text-blue-300">{Number(latestData.ndmi_mean).toFixed(2)}</div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wider">Moisture</div>
              </div>

              <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-gray-300 font-medium mb-1">
                  <Cloud className="w-3.5 h-3.5" /> Cloud
                </div>
                <div className="text-lg font-bold text-gray-200">{Number(latestData.cloud_cover).toFixed(1)}%</div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wider">Cover</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 text-center py-2">No satellite telemetry available</div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-400" /> Historical Telemetry
              </span>
              <div className="flex gap-1 bg-black/40 p-0.5 rounded border border-white/5">
                <button
                  onClick={() => setMetricView('both')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${metricView === 'both' ? 'bg-emerald-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
                >
                  Both
                </button>
                <button
                  onClick={() => setMetricView('ndvi')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${metricView === 'ndvi' ? 'bg-emerald-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
                >
                  NDVI
                </button>
                <button
                  onClick={() => setMetricView('ndmi')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${metricView === 'ndmi' ? 'bg-blue-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
                >
                  NDMI
                </button>
              </div>
            </div>

            <div className="h-48 w-full pt-2">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                    <XAxis
                      dataKey="displayDate"
                      stroke="#666666"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="index"
                      domain={[-0.2, 1.0]}
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="cloud"
                      orientation="right"
                      domain={[0, 100]}
                      hide
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                        color: '#fff'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                    <Bar
                      yAxisId="cloud"
                      dataKey="cloud"
                      name="Cloud %"
                      fill="#334155"
                      opacity={0.4}
                      barSize={8}
                    />
                    {(metricView === 'both' || metricView === 'ndvi') && (
                      <Line
                        yAxisId="index"
                        type="monotone"
                        dataKey="ndvi"
                        name="NDVI"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#10b981' }}
                        activeDot={{ r: 5 }}
                      />
                    )}
                    {(metricView === 'both' || metricView === 'ndmi') && (
                      <Line
                        yAxisId="index"
                        type="monotone"
                        dataKey="ndmi"
                        name="NDMI"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={{ r: 3, fill: '#3b82f6' }}
                        activeDot={{ r: 5 }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  No telemetry data available for this block.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
