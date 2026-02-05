import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  throw new Error('Supabase credentials are not configured. Please replace the placeholder values in your .env.local file with your actual Supabase URL and anonymous key.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
