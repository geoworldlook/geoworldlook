
import { VineyardStat } from "@/types/vineyard";

function generateVineyardCurve(weekIndex: number): { ndvi: number; ndmi: number } {
  // Simulates a realistic vineyard phenology curve
  let ndvi = 0.2;
  let ndmi = 0.1;

  if (weekIndex <= 12) {
    ndvi = 0.2 + Math.random() * 0.05;
    ndmi = 0.1 + Math.random() * 0.05;
  } else if (weekIndex <= 21) {
    ndvi = 0.3 + (weekIndex - 12) * 0.04;
    ndmi = 0.15 + (weekIndex - 12) * 0.03;
  } else if (weekIndex <= 30) {
    ndvi = 0.75 + Math.random() * 0.1;
    ndmi = 0.4 + Math.random() * 0.1;
  } else if (weekIndex <= 34) {
    ndvi = 0.85 - (weekIndex - 30) * 0.15;
    ndmi = 0.3 - (weekIndex - 30) * 0.05;
  } else {
    ndvi = 0.2 + Math.random() * 0.08;
    ndmi = 0.1 + Math.random() * 0.05;
  }

  return {
    ndvi: parseFloat(ndvi.toFixed(3)),
    ndmi: parseFloat(ndmi.toFixed(3))
  };
}

export function generateMockStats(): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2024-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    const curve = generateVineyardCurve(i);
    stats.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: curve.ndvi,
      ndmi_mean: curve.ndmi,
      cloud_cover: Math.floor(Math.random() * 15)
    });
  }
  return stats;
}

export const MOCK_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "vb-01",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [15.520, 51.930],
          [15.525, 51.930],
          [15.525, 51.935],
          [15.520, 51.935],
          [15.520, 51.930]
        ]]
      },
      properties: {
        id: "vb-01",
        name: "Parcela Nord Nebbiolo",
        area_ha: 2.5
      }
    },
    {
      type: "Feature",
      id: "vb-02",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [15.530, 51.932],
          [15.538, 51.932],
          [15.538, 51.938],
          [15.530, 51.938],
          [15.530, 51.932]
        ]]
      },
      properties: {
        id: "vb-02",
        name: "Chardonnay Hill",
        area_ha: 4.2
      }
    }
  ]
};
