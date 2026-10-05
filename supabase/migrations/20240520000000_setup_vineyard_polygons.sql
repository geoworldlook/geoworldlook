-- 1. Tworzymy tabelę dla działek winnicy (wymaga włączonego rozszerzenia PostGIS)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS vineyard_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- np. 'Parcela Nord Nebbiolo'
  area_ha numeric(6,2),
  geom geometry(Polygon, 4326) NOT NULL, -- Dokładne granice pola
  created_at timestamptz DEFAULT now()
);

-- 2. Tabela na wyniki z satelity
CREATE TABLE IF NOT EXISTS vineyard_stats (
  block_id uuid REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  date date NOT NULL,
  cloud_cover numeric(5,2),
  ndvi_mean numeric(5,3),
  ndmi_mean numeric(5,3), -- NDMI do oceny stresu wodnego
  PRIMARY KEY (block_id, date)
);

-- 3. Funkcja RPC zwracająca działki winnicy w formacie GeoJSON FeatureCollection
CREATE OR REPLACE FUNCTION get_vineyard_blocks_geojson()
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', COALESCE(json_agg(
        json_build_object(
          'type', 'Feature',
          'id', id,
          'geometry', ST_AsGeoJSON(geom)::json,
          'properties', json_build_object(
            'id', id,
            'name', name,
            'area_ha', area_ha
          )
        )
      ), '[]'::json)
    )
    FROM vineyard_blocks
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Przykładowe dane początkowe (Przykłady działek winnic z geometrią Poligon)
INSERT INTO vineyard_blocks (id, name, area_ha, geom)
VALUES
  (
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Parcela Nord Nebbiolo',
    4.25,
    ST_GeomFromText('POLYGON((15.520 51.930, 15.528 51.932, 15.526 51.925, 15.518 51.923, 15.520 51.930))', 4326)
  ),
  (
    'a1b2c3d4-0002-4000-8000-000000000002',
    'Parcela Sud Chardonnay',
    3.80,
    ST_GeomFromText('POLYGON((15.535 51.920, 15.543 51.922, 15.541 51.915, 15.533 51.913, 15.535 51.920))', 4326)
  ),
  (
    'a1b2c3d4-0003-4000-8000-000000000003',
    'Winnica Zielona Góra Sector A',
    5.10,
    ST_GeomFromText('POLYGON((15.500 51.940, 15.510 51.943, 15.508 51.935, 15.498 51.932, 15.500 51.940))', 4326)
  )
ON CONFLICT (id) DO NOTHING;

-- Statystyki początkowe dla Parcela Nord Nebbiolo
INSERT INTO vineyard_stats (block_id, date, cloud_cover, ndvi_mean, ndmi_mean)
VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', '2025-05-15', 12.5, 0.450, 0.210),
  ('a1b2c3d4-0001-4000-8000-000000000001', '2025-06-20', 5.0, 0.720, 0.380),
  ('a1b2c3d4-0001-4000-8000-000000000001', '2025-07-25', 8.2, 0.810, 0.420),
  ('a1b2c3d4-0001-4000-8000-000000000001', '2025-08-30', 2.0, 0.680, 0.290),
  ('a1b2c3d4-0002-4000-8000-000000000002', '2025-05-15', 12.5, 0.420, 0.190),
  ('a1b2c3d4-0002-4000-8000-000000000002', '2025-06-20', 5.0, 0.690, 0.350),
  ('a1b2c3d4-0002-4000-8000-000000000002', '2025-07-25', 8.2, 0.780, 0.390),
  ('a1b2c3d4-0002-4000-8000-000000000002', '2025-08-30', 2.0, 0.650, 0.260),
  ('a1b2c3d4-0003-4000-8000-000000000003', '2025-05-15', 12.5, 0.480, 0.230),
  ('a1b2c3d4-0003-4000-8000-000000000003', '2025-06-20', 5.0, 0.750, 0.410),
  ('a1b2c3d4-0003-4000-8000-000000000003', '2025-07-25', 8.2, 0.830, 0.450),
  ('a1b2c3d4-0003-4000-8000-000000000003', '2025-08-30', 2.0, 0.710, 0.310)
ON CONFLICT (block_id, date) DO NOTHING;
