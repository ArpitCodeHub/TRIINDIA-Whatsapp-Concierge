import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let _supabaseAdmin: SupabaseClient<Database> | null = null

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key'
    _supabaseAdmin = createClient<Database>(url, key)
  }
  return _supabaseAdmin
}
