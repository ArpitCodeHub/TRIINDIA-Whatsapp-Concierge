import { getSupabaseAdmin } from '@/lib/supabase/server'
import type { Message, Guest, Booking } from '@/types'

export async function fetchGuestContext(guestId: string, conversationId: string) {
  const [messagesResult, guestResult, bookingResult] = await Promise.all([
    getSupabaseAdmin()
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20),

    getSupabaseAdmin().from('guests').select('*').eq('id', guestId).single(),

    getSupabaseAdmin()
      .from('bookings')
      .select('*')
      .eq('guest_id', guestId)
      .in('status', ['confirmed', 'checked_in'])
      .order('check_in', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    messages: (messagesResult.data || []) as Message[],
    guest: guestResult.data as Guest | null,
    booking: bookingResult.data as Booking | null,
  }
}
