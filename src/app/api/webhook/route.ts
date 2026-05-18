import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getOpenAI } from '@/lib/ai/client'
import { buildPrompt } from '@/lib/ai/prompt'
import { fetchGuestContext } from '@/lib/memory/fetch'
import { fetchKnowledgeBase } from '@/lib/knowledge/fetch'
import { sendWhatsAppMessage } from '@/lib/whatsapp/send'
import type { AIResponse } from '@/types'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return NextResponse.json(parseInt(challenge || '0'))
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const entry = body.entry?.[0]
  if (!entry) {
    return NextResponse.json({ status: 'ignored' })
  }

  const changes = entry.changes?.[0]
  if (!changes || changes.field !== 'messages') {
    return NextResponse.json({ status: 'ignored' })
  }

  const value = changes.value
  const message = value.messages?.[0]
  const contact = value.contacts?.[0]

  if (!message || !contact) {
    return NextResponse.json({ status: 'ignored' })
  }

  if (message.type !== 'text') {
    return NextResponse.json({ status: 'ignored' })
  }

  const phone = message.from
  const guestName = contact.profile.name
  const messageBody = message.text?.body

  if (!phone || !messageBody) {
    return NextResponse.json({ status: 'ignored' })
  }

  try {
    let guest: any = (await getSupabaseAdmin()
      .from('guests')
      .select('id, hotel_id, name')
      .eq('phone', phone)
      .maybeSingle()).data

    if (!guest) {
      const { data: newGuest } = await getSupabaseAdmin()
        .from('guests')
        .insert({ phone, name: guestName })
        .select('id, hotel_id')
        .single()
      guest = newGuest
    } else if (!guest?.name && guestName) {
      await getSupabaseAdmin().from('guests').update({ name: guestName }).eq('id', guest.id)
    }

    let { data: conversation } = await getSupabaseAdmin()
      .from('conversations')
      .select('id')
      .eq('guest_id', guest!.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!conversation) {
      const { data: newConv } = await getSupabaseAdmin()
        .from('conversations')
        .insert({ guest_id: guest!.id, hotel_id: (guest as any).hotel_id })
        .select('id')
        .single()
      conversation = newConv
    }

    await getSupabaseAdmin().from('messages').insert({
      conversation_id: conversation!.id,
      guest_id: guest!.id,
      hotel_id: (guest as any).hotel_id,
      role: 'guest',
      content: messageBody,
    })

    await getSupabaseAdmin()
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation!.id)

    // AI reply — inlined for Vercel serverless reliability
    const [{ messages, guest: guestProfile, booking }, kbEntries] = await Promise.all([
      fetchGuestContext(guest!.id, conversation!.id),
      fetchKnowledgeBase((guest as any).hotel_id || undefined),
    ])

    const hotelDetails = kbEntries
      .filter((e) => e.category === 'hotel_info')
      .map((e) => `${e.title}: ${e.content}`)
      .join('\n')

    const prompt = buildPrompt({
      hotelDetails,
      kbEntries,
      conversationHistory: messages,
      guest: guestProfile,
      booking,
      currentMessage: messageBody,
    })

    const completion = await getOpenAI().chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    })

    const rawResponse = completion.choices[0]?.message?.content
    let aiResult: AIResponse
    try {
      aiResult = JSON.parse(rawResponse || '{}')
    } catch {
      aiResult = {
        response: 'I apologize, I am having trouble processing your message. Let me connect you with our team.',
        intent: 'general',
        confidence: 'low',
        escalation_required: true,
        escalation_reason: 'AI response parsing failed',
      }
    }

    await getSupabaseAdmin()
      .from('messages')
      .insert({
        conversation_id: conversation!.id,
        guest_id: guest!.id,
        hotel_id: (guest as any).hotel_id,
        role: 'ai',
        content: aiResult.response,
        intent: aiResult.intent,
        confidence: aiResult.confidence,
        escalation_required: aiResult.escalation_required,
        escalation_reason: aiResult.escalation_reason || null,
      })

    await sendWhatsAppMessage(guestProfile?.phone || guest!.phone || '', aiResult.response)

    if (aiResult.escalation_required) {
      await getSupabaseAdmin()
        .from('conversations')
        .update({ status: 'escalated' })
        .eq('id', conversation!.id)

      await getSupabaseAdmin().from('escalations').insert({
        conversation_id: conversation!.id,
        guest_id: guest!.id,
        hotel_id: (guest as any).hotel_id,
        reason: aiResult.escalation_reason || 'Auto-escalated by AI',
      })

      const managerNumber = process.env.MANAGER_WHATSAPP_NUMBER
      if (managerNumber) {
        const escalationAlert = `🚨 *Escalation Required*\n\nGuest: ${guestProfile?.name || 'Unknown'}\nPhone: ${guestProfile?.phone || guest!.phone || 'N/A'}\nMessage: ${messageBody}\nAI Response: ${aiResult.response}\nIntent: ${aiResult.intent}\nReason: ${aiResult.escalation_reason || 'N/A'}\nConfidence: ${aiResult.confidence}\n\nPlease respond to this guest.`
        await sendWhatsAppMessage(managerNumber, escalationAlert)
      }
    }

    return NextResponse.json({ status: 'received' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
