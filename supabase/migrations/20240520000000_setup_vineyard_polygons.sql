-- 1. Tworzymy tabelę dla działek winnicy (wymaga włączonego rozszerzenia PostGIS)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE vineyard_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- np. 'Parcela Nord Nebbiolo'
  area_ha numeric(6,2),
  geom geometry(Polygon, 4326) NOT NULL, -- Dokładne granice pola
  created_at timestamptz DEFAULT now()
);

-- 2. Tabela na wyniki z satelity
CREATE TABLE vineyard_stats (
  block_id uuid REFERENCES vineyard_blocks(id) ON DELETE CASCADE,
  date date NOT NULL,
  cloud_cover numeric(5,2),
  ndvi_mean numeric(5,3),
  ndmi_mean numeric(5,3), -- NDMI do oceny stresu wodnego
  PRIMARY KEY (block_id, date)
);

-- 3. Funkcja pomocnicza do pobierania bloków jako GeoJSON
CREATE OR REPLACE FUNCTION get_vineyard_blocks_geojson()
RETURNS TABLE (
  id uuid,
  name text,
  area_ha numeric,
  geom jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    id,
    name,
    area_ha,
    ST_AsGeoJSON(geom)::jsonb as geom
  FROM vineyard_blocks;
$$;
