import { VineyardBlockCollection, VineyardStats } from "@/types/vineyard";

function generateIndicesCurve(weekIndex: number) {
  // Simulates realistic agricultural phenology for NDVI & NDMI (Moisture)
  // Weeks 0-52
  let ndvi = 0.2;
  let ndmi = -0.1;

  if (weekIndex <= 12) {
    ndvi = 0.22 + Math.random() * 0.05;
    ndmi = -0.05 + Math.random() * 0.04;
  } else if (weekIndex <= 21) {
    ndvi = 0.35 + (weekIndex - 12) * 0.045;
    ndmi = 0.05 + (weekIndex - 12) * 0.03;
  } else if (weekIndex <= 30) {
    ndvi = 0.78 + Math.random() * 0.08;
    ndmi = 0.32 + Math.random() * 0.06;
  } else if (weekIndex <= 34) {
    ndvi = 0.82 - (weekIndex - 30) * 0.12;
    ndmi = 0.25 - (weekIndex - 30) * 0.08;
  } else {
    ndvi = 0.25 + Math.random() * 0.06;
    ndmi = -0.02 + Math.random() * 0.05;
  }

  return {
    ndvi_mean: parseFloat(ndvi.toFixed(3)),
    ndmi_mean: parseFloat(ndmi.toFixed(3)),
    cloud_cover: Math.floor(Math.random() * 18)
  };
}

export function generateMockTimeSeries(): VineyardStats[] {
  const series: VineyardStats[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    const indices = generateIndicesCurve(i);
    series.push({
      date: d.toISOString().split('T')[0],
      ...indices
    });
  }
  return series;
}

export const MOCK_VINEYARD_GEOJSON: VineyardBlockCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "vb-zg-01",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15.5212, 51.9385],
            [15.5268, 51.9392],
            [15.5281, 51.9348],
            [15.5225, 51.9341],
            [15.5212, 51.9385]
          ]
        ]
      },
      properties: {
        id: "vb-zg-01",
        name: "Parcela Nord Pinot Noir",
        area_ha: 14.25,
        created_at: "2024-05-20T10:00:00Z"
      }
    },
    {
      type: "Feature",
      id: "vb-zg-02",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15.5310, 51.9420],
            [15.5375, 51.9431],
            [15.5390, 51.9380],
            [15.5322, 51.9370],
            [15.5310, 51.9420]
          ]
        ]
      },
      properties: {
        id: "vb-zg-02",
        name: "Parcela East Riesling",
        area_ha: 18.60,
        created_at: "2024-05-20T10:30:00Z"
      }
    },
    {
      type: "Feature",
      id: "vb-zg-03",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15.5150, 51.9310],
            [15.5198, 51.9322],
            [15.5205, 51.9275],
            [15.5158, 51.9268],
            [15.5150, 51.9310]
          ]
        ]
      },
      properties: {
        id: "vb-zg-03",
        name: "Parcela South Chardonnay",
        area_ha: 11.80,
        created_at: "2024-05-20T11:00:00Z"
      }
    }
  ]
};
