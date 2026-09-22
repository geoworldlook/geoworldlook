import { VineyardBlock, VineyardBlockStats } from "@/types/vineyard";

function generateNDVI(weekIndex: number): number {
  if (weekIndex <= 12) return 0.22 + Math.random() * 0.05;
  if (weekIndex <= 21) return 0.32 + (weekIndex - 12) * 0.04;
  if (weekIndex <= 30) return 0.72 + Math.random() * 0.12;
  if (weekIndex <= 38) return 0.82 - (weekIndex - 30) * 0.05;
  return 0.25 + Math.random() * 0.08;
}

function generateNDMI(weekIndex: number): number {
  if (weekIndex <= 12) return 0.35 + Math.random() * 0.05;
  if (weekIndex <= 21) return 0.40 + Math.random() * 0.08;
  if (weekIndex <= 30) return 0.18 + Math.random() * 0.10; // Summer heat / water stress
  if (weekIndex <= 38) return 0.25 + Math.random() * 0.08;
  return 0.38 + Math.random() * 0.06;
}

function generateTimeSeries(): VineyardBlockStats[] {
  const series: VineyardBlockStats[] = [];
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
    id: "block-nebbiolo-nord",
    name: "Parcela Nord Nebbiolo",
    area_ha: 4.85,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.5210, 51.9350],
        [15.5250, 51.9360],
        [15.5270, 51.9320],
        [15.5220, 51.9310],
        [15.5210, 51.9350]
      ]]
    },
    timeSeries: generateTimeSeries()
  },
  {
    id: "block-sangiovese-south",
    name: "Parcela South Sangiovese",
    area_ha: 3.42,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.5300, 51.9280],
        [15.5340, 51.9290],
        [15.5360, 51.9250],
        [15.5310, 51.9240],
        [15.5300, 51.9280]
      ]]
    },
    timeSeries: generateTimeSeries()
  },
  {
    id: "block-chardonnay-east",
    name: "Parcela East Chardonnay",
    area_ha: 5.10,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.5400, 51.9330],
        [15.5450, 51.9340],
        [15.5470, 51.9290],
        [15.5410, 51.9280],
        [15.5400, 51.9330]
      ]]
    },
    timeSeries: generateTimeSeries()
  }
];
