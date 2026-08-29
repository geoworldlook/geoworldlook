import { VineyardBlock, VineyardStats } from "@/types/vineyard";

function generateAgriCurve(weekIndex: number): { ndvi: number; ndmi: number } {
  // Simulates agricultural phenology and moisture curves across 52 weeks
  let ndvi = 0.2 + Math.random() * 0.05;
  let ndmi = -0.1 + Math.random() * 0.05;

  if (weekIndex >= 13 && weekIndex <= 21) {
    // Growth spring season
    ndvi = 0.3 + (weekIndex - 12) * 0.04;
    ndmi = 0.05 + (weekIndex - 12) * 0.03;
  } else if (weekIndex >= 22 && weekIndex <= 30) {
    // Summer peak
    ndvi = 0.72 + Math.random() * 0.1;
    ndmi = 0.32 + Math.random() * 0.1;
  } else if (weekIndex >= 31 && weekIndex <= 34) {
    // Harvest / early autumn drop
    ndvi = 0.8 - (weekIndex - 30) * 0.12;
    ndmi = 0.3 - (weekIndex - 30) * 0.08;
  } else if (weekIndex > 34) {
    // Winter dormancy
    ndvi = 0.2 + Math.random() * 0.08;
    ndmi = -0.05 + Math.random() * 0.08;
  }

  return {
    ndvi: parseFloat(ndvi.toFixed(3)),
    ndmi: parseFloat(ndmi.toFixed(3))
  };
}

function generateTimeSeries(): VineyardStats[] {
  const series: VineyardStats[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    const curve = generateAgriCurve(i);

    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: curve.ndvi,
      ndmi_mean: curve.ndmi,
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
      coordinates: [[
        [15.505, 51.935],
        [15.512, 51.937],
        [15.515, 51.932],
        [15.507, 51.930],
        [15.505, 51.935]
      ]]
    },
    timeSeries: generateTimeSeries()
  },
  {
    id: "block-pl-02",
    name: "Parcela South Riesling",
    area_ha: 6.80,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.518, 51.928],
        [15.525, 51.930],
        [15.528, 51.924],
        [15.520, 51.922],
        [15.518, 51.928]
      ]]
    },
    timeSeries: generateTimeSeries()
  },
  {
    id: "block-pl-03",
    name: "Parcela West Pinot Noir",
    area_ha: 3.15,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.492, 51.926],
        [15.499, 51.928],
        [15.501, 51.922],
        [15.494, 51.920],
        [15.492, 51.926]
      ]]
    },
    timeSeries: generateTimeSeries()
  }
];
