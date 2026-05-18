import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp/send'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { phone, message, conversationId, guestId, hotelId } = body

  if (!phone || !message) {
    return NextResponse.json({ error: 'phone and message are required' }, { status: 400 })
  }

  try {
    const result = await sendWhatsAppMessage(phone, message)

    if (result.success && conversationId) {
      await getSupabaseAdmin().from('messages').insert({
        conversation_id: conversationId,
        guest_id: guestId || null,
        hotel_id: hotelId || null,
        role: 'human',
        content: message,
      })

      await getSupabaseAdmin()
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 })
  }
}
