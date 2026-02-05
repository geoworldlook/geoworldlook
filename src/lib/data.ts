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

export const stations: Station[] = [
  { id: 'zermatt', name: 'Zermatt Village', elevation: 1620 },
  { id: 'theodul', name: 'Theodul Glacier', elevation: 3480 },
  { id: 'matterhorn', name: 'Matterhorn Summit', elevation: 4478 },
];

const generateTimeSeriesData = (baseIndex: number, days: number): SnowStat[] => {
  const data: SnowStat[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const dayOfYear = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24);
    const seasonalFactor = Math.cos((dayOfYear / 365.25) * 2 * Math.PI + Math.PI); 
    
    let snowIndex = baseIndex + (seasonalFactor * 0.2) + (Math.random() - 0.5) * 0.1;
    snowIndex = Math.max(0.1, Math.min(0.95, snowIndex));
    
    const cloudCover = Math.random() * 0.6 + (Math.sin(i / 5) * 0.1);
    
    data.push({
      date: date.toISOString().split('T')[0],
      snowIndex: parseFloat(snowIndex.toFixed(2)),
      cloudCover: parseFloat(Math.max(0, Math.min(1, cloudCover)).toFixed(2)),
    });
  }
  return data;
};

export const snowStats: Record<Station['id'], SnowStat[]> = {
  zermatt: generateTimeSeriesData(0.5, 90),
  theodul: generateTimeSeriesData(0.7, 90),
  matterhorn: generateTimeSeriesData(0.85, 90),
};

export type AppData = {
  stations: Station[];
  stats: Record<Station['id'], SnowStat[]>;
}

export const getAppData = async (): Promise<AppData> => {
  // In a real app, you'd fetch this from a database.
  // Here we simulate an async operation.
  return Promise.resolve({
    stations: stations,
    stats: snowStats
  });
}
