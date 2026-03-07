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

-- 3. Funkcja pomocnicza do pobierania działek z ich najnowszymi statystykami
CREATE OR REPLACE FUNCTION get_blocks_with_stats()
RETURNS TABLE (
  id uuid,
  name text,
  area_ha numeric,
  geom jsonb,
  latest_ndvi numeric,
  latest_ndmi numeric,
  latest_date date
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH latest_stats AS (
    SELECT DISTINCT ON (block_id)
      block_id,
      ndvi_mean,
      ndmi_mean,
      date
    FROM vineyard_stats
    ORDER BY block_id, date DESC
  )
  SELECT
    vb.id,
    vb.name,
    vb.area_ha,
    ST_AsGeoJSON(vb.geom)::jsonb,
    ls.ndvi_mean,
    ls.ndmi_mean,
    ls.date
  FROM vineyard_blocks vb
  LEFT JOIN latest_stats ls ON vb.id = ls.block_id;
END;
$$;
