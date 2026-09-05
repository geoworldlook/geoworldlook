import { VineyardBlock, VineyardGeoJSON } from '@/types/vineyard';

export const MOCK_VINEYARD_GEOJSON: VineyardGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'block-1-zielona-gora',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.500, 51.930],
          [15.508, 51.930],
          [15.508, 51.935],
          [15.500, 51.935],
          [15.500, 51.930]
        ]]
      },
      properties: {
        id: 'block-1-zielona-gora',
        name: 'Parcela Nord Riesling',
        area_ha: 4.25
      }
    },
    {
      type: 'Feature',
      id: 'block-2-zielona-gora',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.512, 51.928],
          [15.522, 51.928],
          [15.520, 51.934],
          [15.510, 51.934],
          [15.512, 51.928]
        ]]
      },
      properties: {
        id: 'block-2-zielona-gora',
        name: 'Parcela South Pinot Noir',
        area_ha: 5.80
      }
    },
    {
      type: 'Feature',
      id: 'block-3-zielona-gora',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.492, 51.922],
          [15.499, 51.922],
          [15.499, 51.927],
          [15.492, 51.927],
          [15.492, 51.922]
        ]]
      },
      properties: {
        id: 'block-3-zielona-gora',
        name: 'Parcela East Chardonnay',
        area_ha: 3.10
      }
    }
  ]
};

export const MOCK_VINEYARD_STATS: Record<string, VineyardBlock['timeSeries']> = {
  'block-1-zielona-gora': [
    { date: '2023-05-15', ndvi_mean: 0.45, ndmi_mean: 0.12, cloud_cover: 5.0 },
    { date: '2023-06-15', ndvi_mean: 0.68, ndmi_mean: 0.25, cloud_cover: 2.0 },
    { date: '2023-07-15', ndvi_mean: 0.82, ndmi_mean: 0.38, cloud_cover: 10.0 },
    { date: '2023-08-15', ndvi_mean: 0.79, ndmi_mean: 0.30, cloud_cover: 0.0 },
    { date: '2023-09-15', ndvi_mean: 0.65, ndmi_mean: 0.18, cloud_cover: 12.0 },
    { date: '2023-10-15', ndvi_mean: 0.48, ndmi_mean: 0.08, cloud_cover: 8.0 }
  ],
  'block-2-zielona-gora': [
    { date: '2023-05-15', ndvi_mean: 0.42, ndmi_mean: 0.10, cloud_cover: 5.0 },
    { date: '2023-06-15', ndvi_mean: 0.63, ndmi_mean: 0.20, cloud_cover: 2.0 },
    { date: '2023-07-15', ndvi_mean: 0.76, ndmi_mean: 0.32, cloud_cover: 10.0 },
    { date: '2023-08-15', ndvi_mean: 0.74, ndmi_mean: 0.28, cloud_cover: 0.0 },
    { date: '2023-09-15', ndvi_mean: 0.60, ndmi_mean: 0.15, cloud_cover: 12.0 },
    { date: '2023-10-15', ndvi_mean: 0.43, ndmi_mean: 0.05, cloud_cover: 8.0 }
  ],
  'block-3-zielona-gora': [
    { date: '2023-05-15', ndvi_mean: 0.40, ndmi_mean: 0.08, cloud_cover: 5.0 },
    { date: '2023-06-15', ndvi_mean: 0.61, ndmi_mean: 0.19, cloud_cover: 2.0 },
    { date: '2023-07-15', ndvi_mean: 0.78, ndmi_mean: 0.35, cloud_cover: 10.0 },
    { date: '2023-08-15', ndvi_mean: 0.72, ndmi_mean: 0.26, cloud_cover: 0.0 },
    { date: '2023-09-15', ndvi_mean: 0.58, ndmi_mean: 0.14, cloud_cover: 12.0 },
    { date: '2023-10-15', ndvi_mean: 0.41, ndmi_mean: 0.04, cloud_cover: 8.0 }
  ]
};
