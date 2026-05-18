import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/ai/client'
import { buildPrompt } from '@/lib/ai/prompt'
import { fetchGuestContext } from '@/lib/memory/fetch'
import { fetchKnowledgeBase } from '@/lib/knowledge/fetch'
import { sendWhatsAppMessage } from '@/lib/whatsapp/send'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import type { AIResponse } from '@/types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { guestId, conversationId, hotelId, message } = body

  if (!guestId || !conversationId || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const [{ messages, guest, booking }, kbEntries] = await Promise.all([
      fetchGuestContext(guestId, conversationId),
      fetchKnowledgeBase(hotelId || undefined),
    ])

    const hotelDetails = kbEntries
      .filter((e) => e.category === 'hotel_info')
      .map((e) => `${e.title}: ${e.content}`)
      .join('\n')

    const prompt = buildPrompt({
      hotelDetails,
      kbEntries,
      conversationHistory: messages,
      guest,
      booking,
      currentMessage: message,
    })

    const completion = await getOpenAI().chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    })

    const rawResponse = completion.choices[0]?.message?.content
    if (!rawResponse) {
      throw new Error('Empty response from OpenAI')
    }

    let aiResult: AIResponse
    try {
      aiResult = JSON.parse(rawResponse)
    } catch {
      aiResult = {
        response: 'I apologize, I am having trouble processing your message. Let me connect you with our team.',
        intent: 'general',
        confidence: 'low',
        escalation_required: true,
        escalation_reason: 'AI response parsing failed',
      }
    }

    const { data: aiMessage } = await getSupabaseAdmin()
      .from('messages')
      .insert({
        conversation_id: conversationId,
        guest_id: guestId,
        hotel_id: hotelId,
        role: 'ai',
        content: aiResult.response,
        intent: aiResult.intent,
        confidence: aiResult.confidence,
        escalation_required: aiResult.escalation_required,
        escalation_reason: aiResult.escalation_reason || null,
      })
      .select()
      .single()

    await sendWhatsAppMessage(guest?.phone || '', aiResult.response)

    if (aiResult.escalation_required) {
      await getSupabaseAdmin()
        .from('conversations')
        .update({ status: 'escalated' })
        .eq('id', conversationId)

      await getSupabaseAdmin().from('escalations').insert({
        conversation_id: conversationId,
        guest_id: guestId,
        hotel_id: hotelId,
        reason: aiResult.escalation_reason || 'Auto-escalated by AI',
      })

      const managerNumber = process.env.MANAGER_WHATSAPP_NUMBER
      if (managerNumber) {
        const escalationAlert = `🚨 *Escalation Required*\n\nGuest: ${guest?.name || 'Unknown'}\nPhone: ${guest?.phone || 'N/A'}\nMessage: ${message}\nAI Response: ${aiResult.response}\nIntent: ${aiResult.intent}\nReason: ${aiResult.escalation_reason || 'N/A'}\nConfidence: ${aiResult.confidence}\n\nPlease respond to this guest.`
        await sendWhatsAppMessage(managerNumber, escalationAlert)
      }
    }

    return NextResponse.json({ success: true, message: aiMessage })
  } catch (error) {
    console.error('AI reply error:', error)
    return NextResponse.json({ error: 'Failed to generate AI reply' }, { status: 500 })
  }
}
