
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, Database } from 'lucide-react';
import { Station } from '@/types/stations';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface StationPanelProps {
  station: Station;
  onClose: () => void;
}

export default function StationPanel({ station, onClose }: StationPanelProps) {
  const chartData = station.timeSeries?.map(d => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' })
  })) || [];

  const latestData = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  // Filter to show one label per month on X axis
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.month === d.month))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 z-[1000] w-80 md:w-96 max-h-[calc(100%-2rem)] flex flex-col shadow-2xl bg-black/95 backdrop-blur-xl border border-white/10 overflow-hidden animate-in slide-in-from-right duration-300">
      
      {/* HEADER: Sticky at top */}
      <CardHeader className="shrink-0 flex flex-row items-center justify-between pb-4 border-b border-white/10 space-y-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Station Telemetry</p>
          <CardTitle className="text-lg text-white font-semibold truncate max-w-[200px]">{station.name}</CardTitle>
          <p className="text-[10px] text-gray-500 font-mono uppercase">{station.country}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      {/* CONTENT: Scrollable middle */}
      <CardContent className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6 custom-scrollbar">
        {!latestData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <Database className="w-8 h-8 text-gray-700" />
            <p className="text-gray-500 text-xs">No telemetry available for this station.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10">
                 <p className="text-[10px] text-gray-400 uppercase font-bold mb-2 flex items-center gap-1">
                   <TrendingUp className="w-3 h-3 text-emerald-400" /> NDVI Index
                 </p>
                 <p className="text-2xl font-bold text-white leading-none">
                   {Number(latestData.ndvi_index).toFixed(3)}
                 </p>
               </div>
               <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10">
                 <p className="text-[10px] text-gray-400 uppercase font-bold mb-2 flex items-center gap-1">
                   <Cloud className="w-3 h-3 text-sky-400" /> Clouds
                 </p>
                 <p className="text-2xl font-bold text-white leading-none">
                   {Math.round(latestData.cloud_cover)}%
                 </p>
               </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Phenology Trend (12 Months)</p>
              
              {/* CHART: Fixed height container */}
              <div className="h-[220px] w-full relative bg-white/[0.02] rounded-xl border border-white/10 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      ticks={monthTicks}
                      tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                      stroke="#444" 
                      fontSize={9} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      domain={[0, 1]} 
                      stroke="#444" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false}
                      ticks={[0, 0.5, 1]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                      itemStyle={{ color: '#10b981' }}
                      labelFormatter={(label) => `Observation: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ndvi_index" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={false} 
                      connectNulls={true}
                      activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
              <p className="text-[10px] text-emerald-400 leading-relaxed italic">
                Data reflects spectral reflectance measurements from the Sentinel-2 mission, filtered for cloud-free observations.
              </p>
            </div>
          </>
        )}
      </CardContent>

      {/* FOOTER: Sticky at bottom */}
      <div className="shrink-0 px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[9px] text-gray-500 font-mono uppercase tracking-widest">
          <Calendar className="w-3 h-3 text-emerald-400/50" />
          Updated: {latestData?.date || 'N/A'}
        </div>
        <div className="text-[9px] text-gray-600 font-mono">
          SOURCE: COPERNICUS
        </div>
      </div>
    </Card>
  );
}
