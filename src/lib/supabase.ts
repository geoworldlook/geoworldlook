import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const hasPlaceholderCredentials = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl === 'YOUR_SUPABASE_URL' || 
  supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY';

// To avoid crashing the app at build time, we provide dummy credentials
// if the real ones are not set. The actual API calls will be blocked by a check
// in the API layer, so these dummy credentials will never be used for a real request.
export const supabase = createClient(
  hasPlaceholderCredentials ? 'http://localhost:12345' : supabaseUrl, 
  hasPlaceholderCredentials ? 'dummy-key' : supabaseAnonKey
);

/**
 * Throws an error if Supabase credentials are not configured.
 * This function should be called before any Supabase API calls.
 */
export function checkSupabaseCredentials() {
  if (hasPlaceholderCredentials) {
    throw new Error('Supabase credentials are not configured. Please replace the placeholder values in your .env.local file with your actual Supabase URL and anonymous key.');
  }
}
