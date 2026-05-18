import { getSupabaseAdmin } from '@/lib/supabase/server'
import type { KnowledgeBaseEntry } from '@/types'

export async function fetchKnowledgeBase(hotelId?: string): Promise<KnowledgeBaseEntry[]> {
  let query = getSupabaseAdmin()
    .from('knowledge_base')
    .select('*')
    .eq('is_active', true)
    .order('category')

  if (hotelId) {
    query = query.eq('hotel_id', hotelId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching knowledge base:', error)
    return []
  }

  return (data || []) as KnowledgeBaseEntry[]
}
