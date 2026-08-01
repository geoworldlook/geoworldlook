import { VineyardBlock, VineyardTimeSeries } from "@/types/vineyard";

function generateNDVI(weekIndex: number): number {
  // Simulates a realistic agricultural phenology curve for NDVI
  if (weekIndex <= 12) return 0.2 + Math.random() * 0.05;
  if (weekIndex <= 21) return 0.3 + (weekIndex - 12) * 0.04;
  if (weekIndex <= 30) return 0.75 + Math.random() * 0.1;
  if (weekIndex <= 34) return 0.85 - (weekIndex - 30) * 0.15;
  return 0.2 + Math.random() * 0.08;
}

function generateNDMI(weekIndex: number): number {
  // Simulates a realistic moisture/water-stress phenology curve (NDMI)
  // Moisture typically increases with leaf canopy growth but drops with mid-summer heat/dryness
  if (weekIndex <= 12) return 0.1 + Math.random() * 0.05;
  if (weekIndex <= 21) return 0.2 + (weekIndex - 12) * 0.03;
  if (weekIndex <= 28) return 0.5 + Math.random() * 0.05;
  if (weekIndex <= 35) return 0.4 - (weekIndex - 28) * 0.02; // summer heat drop
  return 0.15 + Math.random() * 0.05;
}

function generateTimeSeries(): VineyardTimeSeries[] {
  const series: VineyardTimeSeries[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(generateNDVI(i).toFixed(3)),
      ndmi_mean: parseFloat(generateNDMI(i).toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 20)
    });
  }
  return series;
}

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: "block-pl-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 4.25,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.485, 51.925],
          [15.495, 51.925],
          [15.495, 51.930],
          [15.485, 51.930],
          [15.485, 51.925]
        ]
      ]
    },
    timeSeries: generateTimeSeries()
  },
  {
    id: "block-pl-02",
    name: "Parcela Sued Chardonnay",
    area_ha: 3.80,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.500, 51.915],
          [15.510, 51.915],
          [15.510, 51.920],
          [15.500, 51.920],
          [15.500, 51.915]
        ]
      ]
    },
    timeSeries: generateTimeSeries()
  },
  {
    id: "block-pl-03",
    name: "Zaborze Syrah",
    area_ha: 5.15,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.520, 51.930],
          [15.535, 51.930],
          [15.535, 51.935],
          [15.520, 51.935],
          [15.520, 51.930]
        ]
      ]
    },
    timeSeries: generateTimeSeries()
  }
];
