
import { Station, StationTimeSeries } from "@/types/stations";

function generateAgriCurve(weekIndex: number): number {
  // Simulates a realistic agricultural phenology curve
  // Jan-Mar (0-12): Low (0.2 - 0.3)
  // Apr-May (13-21): Growth (0.4 - 0.6)
  // Jun-Jul (22-30): Peak (0.7 - 0.85)
  // Aug (31-34): Harvest drop (0.8 -> 0.25)
  // Sep-Dec (35-51): Stable/Low (0.2 - 0.3)
  
  if (weekIndex <= 12) return 0.2 + Math.random() * 0.05;
  if (weekIndex <= 21) return 0.3 + (weekIndex - 12) * 0.04;
  if (weekIndex <= 30) return 0.75 + Math.random() * 0.1;
  if (weekIndex <= 34) return 0.85 - (weekIndex - 30) * 0.15;
  return 0.2 + Math.random() * 0.08;
}

function generateTimeSeries(): StationTimeSeries[] {
  const series: StationTimeSeries[] = [];
  const start = new Date('2025-01-01');
  
  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_index: parseFloat(generateAgriCurve(i).toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 20)
    });
  }
  return series;
}

export const MOCK_STATIONS: Station[] = [
  {
    id: "st-fr-01",
    name: "Beauce Station",
    country: "France",
    coordinates: [1.75, 48.25],
    timeSeries: generateTimeSeries()
  },
  {
    id: "st-it-01",
    name: "Cremona North",
    country: "Italy",
    coordinates: [10.05, 45.15],
    timeSeries: generateTimeSeries()
  },
  {
    id: "st-ch-01",
    name: "Morges West",
    country: "Switzerland",
    coordinates: [6.48, 46.53],
    timeSeries: generateTimeSeries()
  }
];
