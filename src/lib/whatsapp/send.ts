export async function sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    console.error('WhatsApp credentials not configured')
    return { success: false, error: 'WhatsApp credentials not configured' }
  }

  const cleanTo = to.replace('+', '')

  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'text',
        text: {
          body: message,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API error:', data)
      return { success: false, error: data.error?.message || 'Failed to send message' }
    }

    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
