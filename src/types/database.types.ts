import { VineyardBlock, VineyardStat } from './vineyard';

export interface Analysis {
  id: string
  title: string
  category: string
  date: string
  summary: string
  region: string
  status: 'active' | 'completed'
}

export interface SpatialPoint {
  id: string
  lat: number
  lng: number
  value: number
  title: string
}

export interface Database {
  public: {
    Tables: {
      vineyard_blocks: {
        Row: VineyardBlock;
        Insert: Omit<VineyardBlock, 'id' | 'created_at'>;
        Update: Partial<Omit<VineyardBlock, 'id' | 'created_at'>>;
      };
      vineyard_stats: {
        Row: VineyardStat;
        Insert: VineyardStat;
        Update: Partial<VineyardStat>;
      };
    };
  };
}
