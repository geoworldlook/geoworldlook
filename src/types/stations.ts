
export interface StationTimeSeries {
  date: string; // YYYY-MM-DD
  ndvi_index: number; // 0-1
  cloud_cover: number; // 0-100
}

export interface Station {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number]; // [lng, lat]
  timeSeries: StationTimeSeries[];
}
