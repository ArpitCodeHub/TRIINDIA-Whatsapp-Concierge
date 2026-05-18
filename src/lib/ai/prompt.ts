import type { Message, Guest, Booking, KnowledgeBaseEntry } from '@/types'

interface BuildPromptArgs {
  hotelDetails: string
  kbEntries: KnowledgeBaseEntry[]
  conversationHistory: Message[]
  guest: Guest | null
  booking: Booking | null
  currentMessage: string
}

export function buildPrompt({
  hotelDetails,
  kbEntries,
  conversationHistory,
  guest,
  booking,
  currentMessage,
}: BuildPromptArgs): string {
  const kbContent = kbEntries.map((e) => `[${e.category.toUpperCase()}] ${e.title}: ${e.content}`).join('\n\n')

  const historyText = conversationHistory
    .map((m) => `${m.role === 'guest' ? 'Guest' : m.role === 'ai' ? 'AI' : 'Human'}: ${m.content}`)
    .join('\n')

  const guestText = guest
    ? `Name: ${guest.name || 'Unknown'} | Stays: ${guest.total_stays} | VIP: ${guest.is_vip ? 'Yes' : 'No'} | Language: ${guest.preferred_language}`
    : 'New guest, no prior history'

  const bookingText = booking
    ? `Room: ${booking.room_type || 'N/A'} | Check-in: ${booking.check_in || 'N/A'} | Check-out: ${booking.check_out || 'N/A'} | Status: ${booking.status || 'N/A'}`
    : 'No active booking'

  return `You are a warm, professional AI concierge for TRIINDIA Hospitality.

HOTEL CONTEXT:
${hotelDetails}

KNOWLEDGE BASE:
${kbContent || 'No knowledge base entries available.'}

CONVERSATION HISTORY (most recent first):
${historyText || 'No prior conversation.'}

GUEST PROFILE:
${guestText}

CURRENT BOOKING (if any):
${bookingText}

GUIDELINES:
- Respond concisely, WhatsApp-friendly (2-4 sentences max)
- Hospitality-first tone, warm and human-like
- Mirror guest language (Hindi or English naturally)
- Use emojis sparingly (only 😊 🌟 ✨)
- NEVER hallucinate hotel information — use ONLY the knowledge base above
- If uncertain, politely say you are checking and will confirm
- If guest is angry, complaining, or asking for booking changes → escalate
- Support Hindi + English naturally

RESPOND IN JSON FORMAT ONLY with this exact structure:
{
  "response": "your warm, concise reply to send to the guest",
  "intent": "room_inquiry | pricing | amenities | airport_travel | booking | special_request | complaint | general",
  "confidence": "high | medium | low",
  "escalation_required": true or false,
  "escalation_reason": "brief reason if escalating, empty string otherwise"
}

CURRENT GUEST MESSAGE: ${currentMessage}`
}
