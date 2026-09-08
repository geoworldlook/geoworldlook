import { VineyardBlockGeoJSONCollection, VineyardStat } from '@/types/vineyard';

export const MOCK_VINEYARD_GEOJSON: VineyardBlockGeoJSONCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'block-1-nebbiolo',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.512, 51.932],
            [15.518, 51.932],
            [15.517, 51.928],
            [15.511, 51.928],
            [15.512, 51.932]
          ]
        ]
      },
      properties: {
        id: 'block-1-nebbiolo',
        name: 'Parcela Nord Nebbiolo',
        area_ha: 4.25,
        created_at: new Date().toISOString()
      }
    },
    {
      type: 'Feature',
      id: 'block-2-riesling',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.520, 51.931],
            [15.527, 51.931],
            [15.526, 51.927],
            [15.519, 51.927],
            [15.520, 51.931]
          ]
        ]
      },
      properties: {
        id: 'block-2-riesling',
        name: 'Sektor Południe Riesling',
        area_ha: 5.80,
        created_at: new Date().toISOString()
      }
    },
    {
      type: 'Feature',
      id: 'block-3-pinot-noir',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.505, 51.926],
            [15.514, 51.926],
            [15.513, 51.922],
            [15.504, 51.922],
            [15.505, 51.926]
          ]
        ]
      },
      properties: {
        id: 'block-3-pinot-noir',
        name: 'Wzgórze Pinot Noir',
        area_ha: 6.15,
        created_at: new Date().toISOString()
      }
    }
  ]
};

export const MOCK_VINEYARD_STATS: Record<string, VineyardStat[]> = {
  'block-1-nebbiolo': [
    { date: '2024-01-15', ndvi_mean: 0.22, ndmi_mean: -0.15, cloud_cover: 12.0 },
    { date: '2024-02-15', ndvi_mean: 0.28, ndmi_mean: -0.10, cloud_cover: 8.5 },
    { date: '2024-03-15', ndvi_mean: 0.41, ndmi_mean: 0.05, cloud_cover: 15.0 },
    { date: '2024-04-15', ndvi_mean: 0.58, ndmi_mean: 0.18, cloud_cover: 5.2 },
    { date: '2024-05-15', ndvi_mean: 0.72, ndmi_mean: 0.32, cloud_cover: 10.0 },
    { date: '2024-06-15', ndvi_mean: 0.81, ndmi_mean: 0.28, cloud_cover: 3.1 },
    { date: '2024-07-15', ndvi_mean: 0.84, ndmi_mean: 0.21, cloud_cover: 2.0 },
    { date: '2024-08-15', ndvi_mean: 0.79, ndmi_mean: 0.15, cloud_cover: 4.5 },
    { date: '2024-09-15', ndvi_mean: 0.68, ndmi_mean: 0.08, cloud_cover: 9.0 },
    { date: '2024-10-15', ndvi_mean: 0.51, ndmi_mean: -0.02, cloud_cover: 14.2 }
  ],
  'block-2-riesling': [
    { date: '2024-01-15', ndvi_mean: 0.25, ndmi_mean: -0.12, cloud_cover: 12.0 },
    { date: '2024-02-15', ndvi_mean: 0.30, ndmi_mean: -0.08, cloud_cover: 8.5 },
    { date: '2024-03-15', ndvi_mean: 0.45, ndmi_mean: 0.08, cloud_cover: 15.0 },
    { date: '2024-04-15', ndvi_mean: 0.62, ndmi_mean: 0.22, cloud_cover: 5.2 },
    { date: '2024-05-15', ndvi_mean: 0.76, ndmi_mean: 0.35, cloud_cover: 10.0 },
    { date: '2024-06-15', ndvi_mean: 0.85, ndmi_mean: 0.31, cloud_cover: 3.1 },
    { date: '2024-07-15', ndvi_mean: 0.88, ndmi_mean: 0.25, cloud_cover: 2.0 },
    { date: '2024-08-15', ndvi_mean: 0.82, ndmi_mean: 0.18, cloud_cover: 4.5 },
    { date: '2024-09-15', ndvi_mean: 0.71, ndmi_mean: 0.12, cloud_cover: 9.0 },
    { date: '2024-10-15', ndvi_mean: 0.55, ndmi_mean: 0.01, cloud_cover: 14.2 }
  ],
  'block-3-pinot-noir': [
    { date: '2024-01-15', ndvi_mean: 0.20, ndmi_mean: -0.18, cloud_cover: 12.0 },
    { date: '2024-02-15', ndvi_mean: 0.26, ndmi_mean: -0.14, cloud_cover: 8.5 },
    { date: '2024-03-15', ndvi_mean: 0.38, ndmi_mean: 0.02, cloud_cover: 15.0 },
    { date: '2024-04-15', ndvi_mean: 0.54, ndmi_mean: 0.14, cloud_cover: 5.2 },
    { date: '2024-05-15', ndvi_mean: 0.68, ndmi_mean: 0.26, cloud_cover: 10.0 },
    { date: '2024-06-15', ndvi_mean: 0.77, ndmi_mean: 0.22, cloud_cover: 3.1 },
    { date: '2024-07-15', ndvi_mean: 0.80, ndmi_mean: 0.16, cloud_cover: 2.0 },
    { date: '2024-08-15', ndvi_mean: 0.75, ndmi_mean: 0.10, cloud_cover: 4.5 },
    { date: '2024-09-15', ndvi_mean: 0.63, ndmi_mean: 0.04, cloud_cover: 9.0 },
    { date: '2024-10-15', ndvi_mean: 0.48, ndmi_mean: -0.05, cloud_cover: 14.2 }
  ]
};
