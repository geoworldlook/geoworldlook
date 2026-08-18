import { VineyardBlock, VineyardTimeSeries } from "@/types/vineyard";

function generateAgriCurve(weekIndex: number): { ndvi: number; ndmi: number } {
  // Simulates realistic agricultural phenology & moisture curve
  let ndvi = 0.2;
  let ndmi = -0.1;

  if (weekIndex <= 12) {
    ndvi = 0.2 + Math.random() * 0.05;
    ndmi = -0.15 + Math.random() * 0.08;
  } else if (weekIndex <= 21) {
    ndvi = 0.3 + (weekIndex - 12) * 0.04;
    ndmi = 0.0 + (weekIndex - 12) * 0.03;
  } else if (weekIndex <= 30) {
    ndvi = 0.75 + Math.random() * 0.1;
    ndmi = 0.25 + Math.random() * 0.1;
  } else if (weekIndex <= 34) {
    ndvi = 0.85 - (weekIndex - 30) * 0.15;
    ndmi = 0.1 - (weekIndex - 30) * 0.08;
  } else {
    ndvi = 0.2 + Math.random() * 0.08;
    ndmi = -0.1 + Math.random() * 0.05;
  }

  return {
    ndvi: parseFloat(ndvi.toFixed(3)),
    ndmi: parseFloat(ndmi.toFixed(3)),
  };
}

function generateTimeSeries(): VineyardTimeSeries[] {
  const series: VineyardTimeSeries[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    const curve = generateAgriCurve(i);
    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: curve.ndvi,
      ndmi_mean: curve.ndmi,
      cloud_cover: Math.floor(Math.random() * 20),
    });
  }
  return series;
}

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: "blk-zg-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 4.85,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.5120, 51.9380],
        [15.5170, 51.9385],
        [15.5180, 51.9350],
        [15.5130, 51.9345],
        [15.5120, 51.9380]
      ]]
    },
    timeSeries: generateTimeSeries()
  },
  {
    id: "blk-zg-02",
    name: "Parcela Sur Solarix",
    area_ha: 6.20,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.5200, 51.9340],
        [15.5260, 51.9345],
        [15.5270, 51.9310],
        [15.5210, 51.9305],
        [15.5200, 51.9340]
      ]]
    },
    timeSeries: generateTimeSeries()
  },
  {
    id: "blk-zg-03",
    name: "Parcela West Riesling",
    area_ha: 3.50,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.5050, 51.9360],
        [15.5100, 51.9365],
        [15.5105, 51.9330],
        [15.5055, 51.9325],
        [15.5050, 51.9360]
      ]]
    },
    timeSeries: generateTimeSeries()
  }
];
