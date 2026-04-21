import { VineyardBlock, VineyardStat } from '@/types/vineyard';

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    created_at: new Date().toISOString(),
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.500, 51.900],
        [15.505, 51.900],
        [15.505, 51.905],
        [15.500, 51.905],
        [15.500, 51.900]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'Parcela Południowa Riesling',
    area_ha: 1.8,
    created_at: new Date().toISOString(),
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.510, 51.910],
        [15.515, 51.910],
        [15.515, 51.915],
        [15.510, 51.915],
        [15.510, 51.910]
      ]]
    }
  }
];

export const MOCK_VINEYARD_STATS: Record<string, VineyardStat[]> = {
  'block-1': [
    { block_id: 'block-1', date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.45, ndmi_mean: 0.32 },
    { block_id: 'block-1', date: '2024-02-01', cloud_cover: 25, ndvi_mean: 0.48, ndmi_mean: 0.35 },
    { block_id: 'block-1', date: '2024-03-01', cloud_cover: 5, ndvi_mean: 0.55, ndmi_mean: 0.40 },
    { block_id: 'block-1', date: '2024-04-01', cloud_cover: 15, ndvi_mean: 0.65, ndmi_mean: 0.45 },
    { block_id: 'block-1', date: '2024-05-01', cloud_cover: 0, ndvi_mean: 0.75, ndmi_mean: 0.50 },
  ],
  'block-2': [
    { block_id: 'block-2', date: '2024-01-01', cloud_cover: 12, ndvi_mean: 0.42, ndmi_mean: 0.30 },
    { block_id: 'block-2', date: '2024-02-01', cloud_cover: 20, ndvi_mean: 0.44, ndmi_mean: 0.33 },
    { block_id: 'block-2', date: '2024-03-01', cloud_cover: 8, ndvi_mean: 0.52, ndmi_mean: 0.38 },
    { block_id: 'block-2', date: '2024-04-01', cloud_cover: 18, ndvi_mean: 0.60, ndmi_mean: 0.42 },
    { block_id: 'block-2', date: '2024-05-01', cloud_cover: 2, ndvi_mean: 0.70, ndmi_mean: 0.48 },
  ]
};
