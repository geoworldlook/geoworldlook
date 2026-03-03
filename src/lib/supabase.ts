
/**
 * Mock Supabase Integration for GeoWorldLook
 * In a production environment, this would use @supabase/ssr
 */

export type SpatialDataPoint = {
  id: string;
  name: string;
  coordinates: [number, number];
  category: string;
  intensity: number;
}

export const fetchSpatialData = async (): Promise<SpatialDataPoint[]> => {
  // Simulate database fetch
  return [
    { id: '1', name: 'Urban Cluster Alpha', coordinates: [-118.2437, 34.0522], category: 'Development', intensity: 0.8 },
    { id: '2', name: 'Reforestation Sector G', coordinates: [-122.4194, 37.7749], category: 'Environment', intensity: 0.4 },
    { id: '3', name: 'Coastal Station 4', coordinates: [-80.1918, 25.7617], category: 'Infrastructure', intensity: 0.9 },
  ];
}

export type Analysis = {
  id: string;
  title: string;
  content: string;
  slug: string;
}

export const fetchAnalyses = async (): Promise<Analysis[]> => {
  return [
    { id: 'a1', title: 'Climate impact on sub-tropical biomes', content: '...', slug: 'climate-impact' },
    { id: 'a2', title: 'Optimizing high-speed rail routing via LiDAR', content: '...', slug: 'rail-routing' },
  ];
}
