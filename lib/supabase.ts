import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Public client — safe for server components (anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
