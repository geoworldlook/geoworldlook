"use client"

import dynamic from 'next/dynamic'

const MapViewer = dynamic(
  () => import('./MapViewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full rounded-xl bg-[#111] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">Initializing Map...</p>
        </div>
      </div>
    )
  }
)

export default function MapViewerWrapper({ initialData }: { initialData?: any }) {
  return <MapViewer initialData={initialData} />
}
