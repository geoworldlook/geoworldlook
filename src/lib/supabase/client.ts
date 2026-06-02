
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[GeoWorldLook] Supabase env vars missing — using placeholder client');
    // Return a dummy client or handle it in hooks.
    // createBrowserClient might still throw if values are empty strings or invalid URLs.
    return createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
