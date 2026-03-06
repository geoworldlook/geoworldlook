
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Cloud, Calendar, AlertCircle } from 'lucide-react';
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
  // Use connectNulls=true in Line or ensure data is sorted to handle satellite data gaps
  const chartData = station.timeSeries.map(d => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' }),
    // Explicitly handle NDVI if missing (though Supabase query usually returns existing records)
    ndvi: d.ndvi_index 
  }));

  const latestData = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  // Filter for unique months to display clean ticks
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.month === d.month))
    .map(d => d.date);

  return (
    <Card className="absolute top-4 right-4 w-80 md:w-96 shadow-2xl border-white/[0.08] bg-black/90 backdrop-blur-xl animate-in slide-in-from-right duration-300 z-[1000] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-white/[0.05]">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Station Telemetry</p>
          <CardTitle className="text-lg text-white font-semibold">{station.name}</CardTitle>
          <p className="text-[10px] text-gray-500 font-mono uppercase">{station.country}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {!latestData ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <AlertCircle className="text-gray-600 w-8 h-8" />
            <p className="text-gray-500 text-xs">No telemetry available for this station.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.05] group hover:border-emerald-500/30 transition-colors">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> NDVI Index
                </p>
                <p className="text-3xl font-bold text-white tracking-tighter">
                  {latestData.ndvi_index.toFixed(3)}
                </p>
              </div>
              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.05] group hover:border-sky-500/30 transition-colors">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-sky-400" /> Clouds
                </p>
                <p className="text-3xl font-bold text-white tracking-tighter">
                  {Math.round(latestData.cloud_cover)}%
                </p>
              </div>
            </div>

            <div className="h-56 w-full relative group">
              <div className="absolute inset-0 bg-emerald-500/5 rounded-xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    ticks={monthTicks}
                    tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                    stroke="#444" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 1]} 
                    stroke="#444" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    ticks={[0, 0.5, 1]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0a0a', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '8px',
                      fontSize: '11px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    labelStyle={{ color: '#888', marginBottom: '4px' }}
                    labelFormatter={(label) => `Observation: ${label}`}
                    cursor={{ stroke: 'rgba(16, 185, 129, 0.2)', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ndvi_index" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    connectNulls={true} // Crucial for satellite data gaps
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                <Calendar className="w-3 h-3 text-emerald-400/50" />
                SYNC: {latestData.date}
              </div>
              <div className="text-[10px] text-gray-600 italic">
                Source: Copernicus Sentinel-2
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
