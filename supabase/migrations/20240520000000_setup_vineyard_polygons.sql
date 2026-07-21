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

-- 3. Funkcja RPC do zwracania danych GeoJSON dla działek
CREATE OR REPLACE FUNCTION get_vineyard_blocks_geojson()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT COALESCE(
    json_build_object(
      'type', 'FeatureCollection',
      'features', COALESCE(
        json_agg(
          json_build_object(
            'type', 'Feature',
            'id', id,
            'geometry', ST_AsGeoJSON(geom)::json,
            'properties', json_build_object(
              'id', id,
              'name', name,
              'area_ha', area_ha,
              'created_at', created_at
            )
          )
        ),
        '[]'::json
      )
    ),
    '{"type": "FeatureCollection", "features": []}'::json
  ) INTO result
  FROM vineyard_blocks;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Przykładowe dane dla lokalnego rozwoju i testów
INSERT INTO vineyard_blocks (id, name, area_ha, geom) VALUES
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'Parcela Nord Nebbiolo', 4.50, ST_GeomFromText('POLYGON((15.501 51.901, 15.509 51.901, 15.509 51.908, 15.501 51.908, 15.501 51.901))', 4326)),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Parcela Południe Pinot Noir', 3.20, ST_GeomFromText('POLYGON((15.512 51.912, 15.520 51.912, 15.520 51.919, 15.512 51.919, 15.512 51.912))', 4326))
ON CONFLICT (id) DO NOTHING;

INSERT INTO vineyard_stats (block_id, date, cloud_cover, ndvi_mean, ndmi_mean) VALUES
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2025-01-15', 5.00, 0.150, -0.100),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2025-02-15', 12.00, 0.180, -0.050),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2025-03-15', 8.00, 0.250, 0.050),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2025-04-15', 22.00, 0.420, 0.150),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2025-05-15', 15.00, 0.650, 0.350),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2025-06-15', 4.00, 0.780, 0.480),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2025-07-15', 10.00, 0.820, 0.520),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2025-08-15', 18.00, 0.750, 0.450),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2025-09-15', 25.00, 0.600, 0.300),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2025-10-15', 30.00, 0.450, 0.150),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2025-11-15', 15.00, 0.300, 0.000),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '2025-12-15', 9.00, 0.200, -0.050),

('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2025-01-15', 10.00, 0.120, -0.150),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2025-02-15', 25.00, 0.150, -0.100),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2025-03-15', 14.00, 0.220, 0.000),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2025-04-15', 30.00, 0.380, 0.120),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2025-05-15', 5.00, 0.600, 0.320),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2025-06-15', 12.00, 0.720, 0.420),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2025-07-15', 15.00, 0.780, 0.460),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2025-08-15', 20.00, 0.700, 0.380),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2025-09-15', 8.00, 0.550, 0.250),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2025-10-15', 35.00, 0.400, 0.100),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2025-11-15', 18.00, 0.280, -0.020),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '2025-12-15', 11.00, 0.180, -0.080)
ON CONFLICT (block_id, date) DO NOTHING;
