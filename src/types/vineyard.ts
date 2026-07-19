export interface VineyardStats {
  block_id: string;
  date: string; // YYYY-MM-DD
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // GeoJSON geometry (Polygon/MultiPolygon)
}

export interface VineyardBlockWithStats extends VineyardBlock {
  stats?: VineyardStats[];
}
