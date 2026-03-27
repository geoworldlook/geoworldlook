
export const MOCK_BLOCKS = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [6.1, 46.5],
        [6.12, 46.5],
        [6.12, 46.52],
        [6.1, 46.52],
        [6.1, 46.5]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'South Merlot Slope',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [6.15, 46.48],
        [6.17, 46.48],
        [6.17, 46.5],
        [6.15, 46.5],
        [6.15, 46.48]
      ]]
    }
  }
];

export const MOCK_STATS = [
  { block_id: 'block-1', date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.4, ndmi_mean: 0.2 },
  { block_id: 'block-1', date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.45, ndmi_mean: 0.25 },
  { block_id: 'block-1', date: '2024-03-01', cloud_cover: 20, ndvi_mean: 0.5, ndmi_mean: 0.3 },
  { block_id: 'block-1', date: '2024-04-01', cloud_cover: 15, ndvi_mean: 0.6, ndmi_mean: 0.4 },
  { block_id: 'block-1', date: '2024-05-01', cloud_cover: 0, ndvi_mean: 0.75, ndmi_mean: 0.5 },
  { block_id: 'block-2', date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.3, ndmi_mean: 0.15 },
  { block_id: 'block-2', date: '2024-05-01', cloud_cover: 0, ndvi_mean: 0.65, ndmi_mean: 0.45 },
];
