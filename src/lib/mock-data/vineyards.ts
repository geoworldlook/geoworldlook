import { VineyardBlockGeoJSON, VineyardStat } from "@/types/vineyard";

function generateTimeSeries(): VineyardStat[] {
  const series: VineyardStat[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);

    // Realistic phenology and moisture curves
    let ndvi = 0.2;
    let ndmi = 0.1;
    if (i > 10 && i <= 32) {
      ndvi = 0.3 + (i - 10) * 0.025 + (Math.sin(i) * 0.02);
      ndmi = 0.2 + (i - 10) * 0.02 + (Math.cos(i) * 0.02);
    } else if (i > 32) {
      ndvi = 0.85 - (i - 32) * 0.025 + (Math.sin(i) * 0.02);
      ndmi = 0.6 - (i - 32) * 0.02 + (Math.cos(i) * 0.02);
    }

    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: Number(Math.max(0.1, Math.min(0.95, ndvi)).toFixed(3)),
      ndmi_mean: Number(Math.max(-0.2, Math.min(0.8, ndmi)).toFixed(3)),
      cloud_cover: Math.floor(10 + Math.random() * 15)
    });
  }
  return series;
}

export const MOCK_VINEYARD_STATS: Record<string, VineyardStat[]> = {
  "vb-zg-01": generateTimeSeries(),
  "vb-zg-02": generateTimeSeries(),
  "vb-zg-03": generateTimeSeries(),
};

export const MOCK_VINEYARD_BLOCKS_GEOJSON: VineyardBlockGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "vb-zg-01",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15.512, 51.938],
            [15.518, 51.939],
            [15.519, 51.934],
            [15.513, 51.933],
            [15.512, 51.938]
          ]
        ]
      },
      properties: {
        id: "vb-zg-01",
        name: "Parcela Nord Nebbiolo",
        area_ha: 4.25
      }
    },
    {
      type: "Feature",
      id: "vb-zg-02",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15.522, 51.937],
            [15.528, 51.938],
            [15.529, 51.932],
            [15.523, 51.931],
            [15.522, 51.937]
          ]
        ]
      },
      properties: {
        id: "vb-zg-02",
        name: "Parcela East Chardonnay",
        area_ha: 5.80
      }
    },
    {
      type: "Feature",
      id: "vb-zg-03",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15.505, 51.930],
            [15.511, 51.931],
            [15.510, 51.926],
            [15.504, 51.925],
            [15.505, 51.930]
          ]
        ]
      },
      properties: {
        id: "vb-zg-03",
        name: "Parcela South Pinot Noir",
        area_ha: 3.10
      }
    }
  ]
};
