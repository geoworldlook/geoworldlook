import { VineyardBlock, VineyardStat } from "@/types/vineyard";

function generateAgriCurve(weekIndex: number, type: "ndvi" | "ndmi"): number {
  // Simulates a realistic agricultural phenology curve
  // Jan-Mar (0-12): Low
  // Apr-May (13-21): Growth
  // Jun-Jul (22-30): Peak
  // Aug (31-34): Harvest drop / dry down
  // Sep-Dec (35-51): Stable/Low

  let base = 0.2;
  if (type === "ndvi") {
    if (weekIndex <= 12) base = 0.2 + Math.random() * 0.05;
    else if (weekIndex <= 21) base = 0.25 + (weekIndex - 12) * 0.05;
    else if (weekIndex <= 30) base = 0.75 + Math.random() * 0.08;
    else if (weekIndex <= 34) base = 0.82 - (weekIndex - 30) * 0.12;
    else base = 0.2 + Math.random() * 0.06;
    return Math.max(0, Math.min(1, base));
  } else {
    // NDMI is usually lower, reflecting water content. It tracks NDVI but is slightly lower
    if (weekIndex <= 12) base = 0.05 + Math.random() * 0.05;
    else if (weekIndex <= 21) base = 0.1 + (weekIndex - 12) * 0.04;
    else if (weekIndex <= 30) base = 0.5 + Math.random() * 0.08;
    else if (weekIndex <= 34) base = 0.55 - (weekIndex - 30) * 0.10;
    else base = 0.05 + Math.random() * 0.05;
    return Math.max(-1, Math.min(1, base));
  }
}

function generateTimeSeries(): VineyardStat[] {
  const series: VineyardStat[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(generateAgriCurve(i, "ndvi").toFixed(3)),
      ndmi_mean: parseFloat(generateAgriCurve(i, "ndmi").toFixed(3)),
      cloud_cover: parseFloat((Math.random() * 25).toFixed(1))
    });
  }
  return series;
}

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: "block-pl-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 14.50,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.500, 51.930],
          [15.510, 51.930],
          [15.510, 51.936],
          [15.500, 51.936],
          [15.500, 51.930]
        ]
      ]
    },
    stats: generateTimeSeries()
  },
  {
    id: "block-pl-02",
    name: "Parcela Sued Pinot Noir",
    area_ha: 9.80,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.510, 51.930],
          [15.520, 51.930],
          [15.520, 51.936],
          [15.510, 51.936],
          [15.510, 51.930]
        ]
      ]
    },
    stats: generateTimeSeries()
  },
  {
    id: "block-pl-03",
    name: "Parcela West Riesling",
    area_ha: 12.20,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.490, 51.924],
          [15.500, 51.924],
          [15.500, 51.930],
          [15.490, 51.930],
          [15.490, 51.924]
        ]
      ]
    },
    stats: generateTimeSeries()
  }
];
