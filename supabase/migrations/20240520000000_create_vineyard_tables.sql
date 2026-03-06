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

-- 3. Funkcja pomocnicza do pobierania działek z ich najnowszymi statystykami jako GeoJSON
CREATE OR REPLACE FUNCTION get_blocks_with_stats()
RETURNS TABLE (
  id uuid,
  name text,
  area_ha numeric,
  geom jsonb,
  created_at timestamptz,
  latest_stats jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vb.id,
    vb.name,
    vb.area_ha,
    st_asgeojson(vb.geom)::jsonb as geom,
    vb.created_at,
    (
      SELECT row_to_json(vs)
      FROM vineyard_stats vs
      WHERE vs.block_id = vb.id
      ORDER BY vs.date DESC
      LIMIT 1
    )::jsonb as latest_stats
  FROM vineyard_blocks vb;
END;
$$;
