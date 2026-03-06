
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
  const chartData = station.timeSeries.map(d => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' }),
    ndvi: d.ndvi_index 
  }));

  const latestData = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  // Filter for unique months to display clean ticks
  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.month === d.month))
    .map(d => d.date);

  return (
    <div className="absolute top-4 right-4 z-[1000] w-80 md:w-96 max-h-[calc(100%-2rem)] flex flex-col animate-in slide-in-from-right duration-300">
      <Card className="w-full flex-1 flex flex-col shadow-xl overflow-hidden border-white/[0.08] bg-black/95 backdrop-blur-xl">
        {/* Header - Fixed */}
        <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0 border-b border-white/[0.05] shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Station Telemetry</p>
            <CardTitle className="text-lg text-white font-semibold truncate max-w-[200px]">{station.name}</CardTitle>
            <p className="text-[10px] text-gray-500 font-mono uppercase">{station.country}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-white hover:bg-white/10 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        {/* Scrollable Content - flex-1 and min-h-0 are critical for scrolling */}
        <CardContent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-6 space-y-6">
          {!latestData ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <AlertCircle className="text-gray-600 w-8 h-8" />
              <p className="text-gray-500 text-xs">No telemetry available for this station.</p>
            </div>
          ) : (
            <>
              {/* KPI Section */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.05] group hover:border-emerald-500/30 transition-colors">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> NDVI Index
                  </p>
                  <p className="text-2xl font-bold text-white tracking-tighter">
                    {latestData.ndvi_index.toFixed(3)}
                  </p>
                </div>
                <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.05] group hover:border-sky-500/30 transition-colors">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-sky-400" /> Clouds
                  </p>
                  <p className="text-2xl font-bold text-white tracking-tighter">
                    {Math.round(latestData.cloud_cover)}%
                  </p>
                </div>
              </div>

              {/* Chart Container - Locked height prevents Recharts expansion loop */}
              <div className="space-y-3 shrink-0">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">12-Month Vegetation Trend</p>
                <div className="h-[250px] w-full shrink-0 relative group bg-white/[0.02] rounded-xl border border-white/[0.05] p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                        contentStyle={{ 
                          backgroundColor: '#0a0a0a', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '8px',
                          fontSize: '10px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                        labelStyle={{ color: '#888', marginBottom: '2px' }}
                        labelFormatter={(label) => `Obs: ${label}`}
                        cursor={{ stroke: 'rgba(16, 185, 129, 0.2)', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="ndvi_index" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        dot={false}
                        activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Additional Info / Legend */}
              <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10 shrink-0">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  <span className="text-emerald-400 font-bold mr-1">Phenology Insight:</span>
                  Higher NDVI values (0.6+) indicate dense, healthy vegetation, while values below 0.3 typically suggest bare soil or harvested areas.
                </p>
              </div>
            </>
          )}
        </CardContent>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-white/[0.05] bg-black/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
              <Calendar className="w-3 h-3 text-emerald-400/50" />
              LAST SYNC: {latestData?.date || 'N/A'}
            </div>
            <div className="text-[9px] text-gray-600 uppercase tracking-tighter">
              Copernicus Sentinel-2
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
