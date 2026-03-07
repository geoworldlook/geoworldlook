
export interface StationTimeSeries {
  date: string; // YYYY-MM-DD
  ndvi_index: number; // 0-1
  ndmi_index?: number; // Added for vineyard support
  cloud_cover: number; // 0-100
}

export interface Station {
  id: string;
  name: string;
  country?: string; // Optional as vineyard blocks might not have country field directly
  area_ha?: number;
  coordinates?: [number, number]; // [lng, lat] - for points, legacy
  geometry?: any; // For polygons
  timeSeries: StationTimeSeries[];
}
