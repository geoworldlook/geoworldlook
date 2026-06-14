
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // In local development or during builds we might not have these.
    // We log a warning but still try to create a client to avoid crashing the whole app
    // if the page using it has its own fallback (like useVineyardData does).
    console.warn('Supabase env vars missing — using placeholder for client creation');
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  return createBrowserClient(url, key)
}
