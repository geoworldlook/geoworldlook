
export const MOCK_VINEYARD_BLOCKS = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 4.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.500, 51.900],
        [15.510, 51.900],
        [15.510, 51.905],
        [15.500, 51.905],
        [15.500, 51.900]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'South Slope Chardonnay',
    area_ha: 3.2,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.520, 51.910],
        [15.530, 51.910],
        [15.530, 51.915],
        [15.520, 51.915],
        [15.520, 51.910]
      ]]
    }
  }
];

export const MOCK_VINEYARD_STATS = {
  'block-1': [
    { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.45, ndmi_mean: 0.15 },
    { date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.48, ndmi_mean: 0.18 },
    { date: '2024-03-01', cloud_cover: 20, ndvi_mean: 0.55, ndmi_mean: 0.25 }
  ],
  'block-2': [
    { date: '2024-01-15', cloud_cover: 0, ndvi_mean: 0.42, ndmi_mean: 0.12 },
    { date: '2024-02-15', cloud_cover: 15, ndvi_mean: 0.46, ndmi_mean: 0.16 },
    { date: '2024-03-15', cloud_cover: 10, ndvi_mean: 0.52, ndmi_mean: 0.22 }
  ]
};
