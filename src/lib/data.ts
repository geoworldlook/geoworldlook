export type Station = {
  id: 'zermatt' | 'theodul' | 'matterhorn';
  name: string;
  elevation: number;
};

export type SnowStat = {
  date: string;
  snowIndex: number;
  cloudCover: number;
};

export type AppData = {
  stations: Station[];
  stats: Record<Station['id'], SnowStat[]>;
}
