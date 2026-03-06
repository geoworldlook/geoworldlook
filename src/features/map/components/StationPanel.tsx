
"use client"

import React from 'react';
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
  const chartData = station.timeSeries?.map(d => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short' }),
    ndvi: d.ndvi_index 
  })) || [];

  const latestData = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  const monthTicks = chartData
    .filter((d, i, self) => i === self.findIndex(t => t.month === d.month))
    .map(d => d.date);

  return (
    <div 
      className="absolute top-4 right-4 z-[9999] w-[320px] md:w-[380px] bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
      style={{ maxHeight: 'calc(100% - 32px)' }}
    >
      {/* Header (Locked at the top) */}
      <div className="shrink-0 p-4 border-b border-white/10 bg-black/50 flex justify-between items-start">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Station Telemetry</p>
          <h2 className="text-lg text-white font-semibold truncate max-w-[180px]">{station.name}</h2>
          <p className="text-[10px] text-gray-500 font-mono uppercase">{station.country}</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content (Scrollable) */}
      <div className="overflow-y-auto p-4 custom-scrollbar space-y-6">
        {!latestData ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <AlertCircle className="text-gray-600 w-8 h-8" />
            <p className="text-gray-500 text-xs">No telemetry available.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> NDVI
                </p>
                <p className="text-2xl font-bold text-white">{latestData.ndvi_index.toFixed(3)}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-sky-400" /> Clouds
                </p>
                <p className="text-2xl font-bold text-white">{Math.round(latestData.cloud_cover)}%</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">12-Month Vegetation Trend</p>
              <div className="w-full h-[250px] bg-white/5 rounded-xl border border-white/10 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      ticks={monthTicks}
                      tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                      stroke="#444" fontSize={9} tickLine={false} axisLine={false}
                    />
                    <YAxis domain={[0, 1]} stroke="#444" fontSize={9} tickLine={false} axisLine={false} ticks={[0, 0.5, 1]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                      labelStyle={{ color: '#888', marginBottom: '2px' }}
                    />
                    <Line 
                      type="monotone" dataKey="ndvi_index" stroke="#10b981" strokeWidth={2} dot={false}
                      activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                <span className="text-emerald-400 font-bold mr-1">Phenology Insight:</span>
                Higher NDVI values (0.6+) indicate dense, healthy vegetation, while values below 0.3 typically suggest bare soil.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                <Calendar className="w-3 h-3 text-emerald-400/50" /> LAST SYNC: {latestData.date}
              </div>
              <div className="text-[9px] text-gray-600 uppercase tracking-tighter">
                Copernicus Sentinel-2
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
