
'use client'

import dynamic from 'next/dynamic'

const MapViewer = dynamic(
  () => import('./MapViewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full rounded-xl bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-[10px] font-medium uppercase tracking-widest">
            Initializing Engine...
          </p>
        </div>
      </div>
    )
  }
)

interface MapViewerWrapperProps {
  points?: any[]
}

export default function MapViewerWrapper({ points }: MapViewerWrapperProps) {
  return <MapViewer points={points} />
}
