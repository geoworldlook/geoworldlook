
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('[GeoWorldLook] Supabase URL is missing - using placeholder for client creation');
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
