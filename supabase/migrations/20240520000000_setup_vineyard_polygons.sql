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

-- 3. Funkcja pomocnicza RPC do pobierania działek jako GeoJSON
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
            'area_ha', area_ha,
            'created_at', created_at
          )
        )
      ), '[]'::json)
    )
    FROM vineyard_blocks
  );
END;
$$ LANGUAGE plpgsql STABLE;
