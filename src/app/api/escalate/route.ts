import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp/send'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { conversationId, reason } = body

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
  }

  try {
    const { data: conversation } = await getSupabaseAdmin()
      .from('conversations')
      .select('guest_id, hotel_id')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { data: guest } = await getSupabaseAdmin()
      .from('guests')
      .select('name, phone')
      .eq('id', conversation.guest_id)
      .single()

    await getSupabaseAdmin()
      .from('conversations')
      .update({ status: 'escalated' })
      .eq('id', conversationId)

    await getSupabaseAdmin().from('escalations').insert({
      conversation_id: conversationId,
      guest_id: conversation.guest_id,
      hotel_id: conversation.hotel_id,
      reason: reason || 'Manual escalation by staff',
    })

    const managerNumber = process.env.MANAGER_WHATSAPP_NUMBER
    if (managerNumber) {
      const alert = `🚨 *Manual Escalation*\n\nGuest: ${guest?.name || 'Unknown'}\nPhone: ${guest?.phone || 'N/A'}\nReason: ${reason || 'Manual escalation'}\n\nPlease take over this conversation.`
      await sendWhatsAppMessage(managerNumber, alert)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Escalation error:', error)
    return NextResponse.json({ error: 'Failed to escalate' }, { status: 500 })
  }
}
