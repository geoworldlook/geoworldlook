import { VineyardBlock, VineyardStats } from "@/types/vineyard";

function generateAgriCurve(weekIndex: number): { ndvi: number; ndmi: number } {
  // Phenology curve simulation for NDVI and NDMI
  let ndvi = 0.2;
  let ndmi = 0.1;

  if (weekIndex <= 12) {
    ndvi = 0.2 + Math.random() * 0.05;
    ndmi = 0.15 + Math.random() * 0.05;
  } else if (weekIndex <= 21) {
    ndvi = 0.3 + (weekIndex - 12) * 0.04;
    ndmi = 0.25 + (weekIndex - 12) * 0.03;
  } else if (weekIndex <= 30) {
    ndvi = 0.75 + Math.random() * 0.1;
    ndmi = 0.5 + Math.random() * 0.1;
  } else if (weekIndex <= 34) {
    ndvi = 0.85 - (weekIndex - 30) * 0.15;
    ndmi = 0.55 - (weekIndex - 30) * 0.1;
  } else {
    ndvi = 0.2 + Math.random() * 0.08;
    ndmi = 0.15 + Math.random() * 0.05;
  }

  return {
    ndvi: parseFloat(ndvi.toFixed(3)),
    ndmi: parseFloat(ndmi.toFixed(3)),
  };
}

export function generateVineyardTimeSeries(): VineyardStats[] {
  const series: VineyardStats[] = [];
  const start = new Date('2024-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    const { ndvi, ndmi } = generateAgriCurve(i);
    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: ndvi,
      ndmi_mean: ndmi,
      cloud_cover: Math.floor(Math.random() * 20),
    });
  }
  return series;
}

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: "vb-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 4.25,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.520, 51.930],
          [15.535, 51.930],
          [15.535, 51.940],
          [15.520, 51.940],
          [15.520, 51.930]
        ]
      ]
    },
    timeSeries: generateVineyardTimeSeries()
  },
  {
    id: "vb-02",
    name: "Parcela Sud Pinot Noir",
    area_ha: 3.80,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.540, 51.920],
          [15.555, 51.920],
          [15.555, 51.930],
          [15.540, 51.930],
          [15.540, 51.920]
        ]
      ]
    },
    timeSeries: generateVineyardTimeSeries()
  },
  {
    id: "vb-03",
    name: "Wzgórza Winniczno - Chardonnay",
    area_ha: 5.10,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.500, 51.910],
          [15.515, 51.910],
          [15.515, 51.920],
          [15.500, 51.920],
          [15.500, 51.910]
        ]
      ]
    },
    timeSeries: generateVineyardTimeSeries()
  }
];
