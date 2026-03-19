import { VineyardStat, VineyardBlockWithStats, VineyardGeoJSON } from "@/types/vineyard";

function generateAgriCurve(weekIndex: number, type: 'NDVI' | 'NDMI'): number {
  if (type === 'NDVI') {
    if (weekIndex <= 12) return 0.2 + Math.random() * 0.05;
    if (weekIndex <= 21) return 0.3 + (weekIndex - 12) * 0.04;
    if (weekIndex <= 30) return 0.75 + Math.random() * 0.1;
    if (weekIndex <= 34) return 0.85 - (weekIndex - 30) * 0.15;
    return 0.2 + Math.random() * 0.08;
  } else {
    // NDMI (Water stress)
    if (weekIndex <= 21) return 0.1 + Math.random() * 0.1;
    if (weekIndex <= 30) return 0.2 + Math.random() * 0.2; // Dry summer
    if (weekIndex <= 34) return 0.1 + Math.random() * 0.1;
    return 0.0 + Math.random() * 0.1;
  }
}

function generateTimeSeries(): VineyardStat[] {
  const series: VineyardStat[] = [];
  const start = new Date('2024-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(generateAgriCurve(i, 'NDVI').toFixed(3)),
      ndmi_mean: parseFloat(generateAgriCurve(i, 'NDMI').toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 20)
    });
  }
  return series;
}

export const MOCK_GEOJSON: VineyardGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: "block-1",
      geometry: {
        type: 'Polygon',
        coordinates: [[[1.75, 48.25], [1.76, 48.25], [1.76, 48.26], [1.75, 48.26], [1.75, 48.25]]]
      },
      properties: {
        id: "block-1",
        name: "Beauce North",
        area_ha: 12.5
      }
    },
    {
      type: 'Feature',
      id: "block-2",
      geometry: {
        type: 'Polygon',
        coordinates: [[[10.05, 45.15], [10.06, 45.15], [10.06, 45.16], [10.05, 45.16], [10.05, 45.15]]]
      },
      properties: {
        id: "block-2",
        name: "Cremona Valley",
        area_ha: 8.2
      }
    }
  ]
};

export const MOCK_STATS_MAP: Record<string, VineyardStat[]> = {
  "block-1": generateTimeSeries(),
  "block-2": generateTimeSeries()
};
