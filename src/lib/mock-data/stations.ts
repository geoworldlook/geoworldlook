import { VineyardBlock, VineyardStats, Station } from "@/types/stations";

function generateAgriCurve(weekIndex: number): number {
  if (weekIndex <= 12) return 0.2 + Math.random() * 0.05;
  if (weekIndex <= 21) return 0.3 + (weekIndex - 12) * 0.04;
  if (weekIndex <= 30) return 0.75 + Math.random() * 0.1;
  if (weekIndex <= 34) return 0.85 - (weekIndex - 30) * 0.15;
  return 0.2 + Math.random() * 0.08;
}

function generateMoistureCurve(weekIndex: number): number {
  // Moisture index (NDMI) tends to peak in spring/early summer and decline during dry late summer
  if (weekIndex <= 15) return 0.25 + Math.random() * 0.08;
  if (weekIndex <= 28) return 0.40 + Math.random() * 0.08;
  if (weekIndex <= 36) return 0.15 + Math.random() * 0.10; // Summer water stress
  return 0.22 + Math.random() * 0.05;
}

export function generateVineyardTimeSeries(): VineyardStats[] {
  const series: VineyardStats[] = [];
  const start = new Date('2025-01-01');
  
  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(generateAgriCurve(i).toFixed(3)),
      ndmi_mean: parseFloat(generateMoistureCurve(i).toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 20)
    });
  }
  return series;
}

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    name: "Parcela Nord Nebbiolo",
    area_ha: 4.25,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.520, 51.930],
        [15.528, 51.932],
        [15.526, 51.925],
        [15.518, 51.923],
        [15.520, 51.930]
      ]]
    },
    timeSeries: generateVineyardTimeSeries()
  },
  {
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    name: "Parcela Sud Chardonnay",
    area_ha: 3.80,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.535, 51.920],
        [15.543, 51.922],
        [15.541, 51.915],
        [15.533, 51.913],
        [15.535, 51.920]
      ]]
    },
    timeSeries: generateVineyardTimeSeries()
  },
  {
    id: "a1b2c3d4-0003-4000-8000-000000000003",
    name: "Winnica Zielona Góra Sector A",
    area_ha: 5.10,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.500, 51.940],
        [15.510, 51.943],
        [15.508, 51.935],
        [15.498, 51.932],
        [15.500, 51.940]
      ]]
    },
    timeSeries: generateVineyardTimeSeries()
  }
];

export const MOCK_STATIONS: Station[] = MOCK_VINEYARD_BLOCKS.map(b => ({
  id: b.id,
  name: b.name,
  country: "Poland",
  coordinates: [b.geom.coordinates[0][0][0], b.geom.coordinates[0][0][1]],
  timeSeries: b.timeSeries
}));
