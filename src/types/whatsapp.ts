export interface WhatsAppWebhookPayload {
  object: string
  entry: WhatsAppEntry[]
}

export interface WhatsAppEntry {
  id: string
  changes: WhatsAppChange[]
}

export interface WhatsAppChange {
  value: WhatsAppValue
  field: string
}

export interface WhatsAppValue {
  messaging_product: string
  contacts: WhatsAppContact[]
  messages: WhatsAppMessage[]
  statuses?: WhatsAppStatus[]
}

export interface WhatsAppContact {
  profile: {
    name: string
  }
  wa_id: string
}

export interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'image' | 'audio' | 'document' | 'video' | 'location' | 'contact'
  text?: {
    body: string
  }
  image?: {
    id: string
    mime_type: string
    sha256: string
    caption?: string
  }
}

export interface WhatsAppStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
}

export interface WhatsAppSendMessage {
  messaging_product: 'whatsapp'
  recipient_type?: string
  to: string
  type: 'text' | 'template'
  text?: {
    body: string
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: WhatsAppTemplateComponent[]
  }
}

export interface WhatsAppTemplateComponent {
  type: 'body'
  parameters: WhatsAppParameter[]
}

export interface WhatsAppParameter {
  type: 'text'
  text: string
}
