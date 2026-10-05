"use client"

import BlockPanel from './BlockPanel';
import { Station, VineyardBlock } from '@/types/stations';

interface StationPanelProps {
  station: Station | VineyardBlock;
  onClose: () => void;
}

export default function StationPanel({ station, onClose }: StationPanelProps) {
  // Convert station structure to VineyardBlock if necessary
  const block: VineyardBlock = 'geom' in station ? station : {
    id: station.id,
    name: station.name,
    area_ha: 1.0,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [station.coordinates[0] - 0.002, station.coordinates[1] - 0.002],
        [station.coordinates[0] + 0.002, station.coordinates[1] - 0.002],
        [station.coordinates[0] + 0.002, station.coordinates[1] + 0.002],
        [station.coordinates[0] - 0.002, station.coordinates[1] + 0.002],
        [station.coordinates[0] - 0.002, station.coordinates[1] - 0.002]
      ]]
    },
    timeSeries: station.timeSeries.map(s => ({
      date: s.date,
      ndvi_mean: 'ndvi_index' in s ? (s as any).ndvi_index : s.ndvi_mean,
      ndmi_mean: 'ndmi_mean' in s ? s.ndmi_mean : 0.3,
      cloud_cover: s.cloud_cover
    }))
  };

  return <BlockPanel block={block} onClose={onClose} />;
}
