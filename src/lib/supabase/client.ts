import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let _supabase: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'
    _supabase = createClient<Database>(url, key)
  }
  return _supabase
}
