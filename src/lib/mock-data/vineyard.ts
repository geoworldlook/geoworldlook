export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON Polygon
}

export interface VineyardStat {
  date: string; // YYYY-MM-DD
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: "block-zg-01",
    name: "Parcela Zachód Pinot Noir",
    area_ha: 4.5,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.48, 51.94],
          [15.49, 51.94],
          [15.49, 51.95],
          [15.48, 51.95],
          [15.48, 51.94]
        ]
      ]
    }
  },
  {
    id: "block-zg-02",
    name: "Parcela Centra Nebbiolo",
    area_ha: 6.2,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.50, 51.93],
          [15.51, 51.93],
          [15.51, 51.94],
          [15.50, 51.94],
          [15.50, 51.93]
        ]
      ]
    }
  },
  {
    id: "block-zg-03",
    name: "Parcela Wschód Chardonnay",
    area_ha: 3.8,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.52, 51.92],
          [15.53, 51.92],
          [15.53, 51.93],
          [15.52, 51.93],
          [15.52, 51.92]
        ]
      ]
    }
  }
];

export function generateMockStats(blockId: string): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2025-01-01');

  // Generate stats for 24 periods over the year (bi-weekly)
  for (let i = 0; i < 24; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 15);

    // Simulate agricultural curve for NDVI
    const month = d.getMonth(); // 0-11
    let ndvi = 0.2;
    if (month >= 3 && month <= 5) ndvi = 0.3 + (month - 3) * 0.15; // spring growth
    else if (month >= 6 && month <= 8) ndvi = 0.75 + Math.random() * 0.1; // summer peak
    else if (month >= 9 && month <= 10) ndvi = 0.5 - (month - 9) * 0.15; // autumn decay

    // Simulate moisture index NDMI
    let ndmi = 0.1;
    if (month >= 5 && month <= 7) ndmi = -0.1 + Math.random() * 0.15; // drier summer stress
    else ndmi = 0.2 + Math.random() * 0.1;

    stats.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat((ndvi + Math.random() * 0.05).toFixed(3)),
      ndmi_mean: parseFloat((ndmi + Math.random() * 0.05).toFixed(3)),
      cloud_cover: parseFloat((Math.random() * 15).toFixed(1))
    });
  }
  return stats;
}
