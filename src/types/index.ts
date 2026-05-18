export interface Hotel {
  id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  email: string | null
  check_in_time: string | null
  check_out_time: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Guest {
  id: string
  phone: string
  name: string | null
  email: string | null
  hotel_id: string | null
  total_stays: number
  last_stay_date: string | null
  lifetime_value: number
  preferred_language: string
  preferences: Record<string, unknown>
  is_vip: boolean
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  guest_id: string | null
  hotel_id: string | null
  status: 'active' | 'escalated' | 'resolved'
  last_message_at: string
  created_at: string
  guest?: Guest
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string | null
  guest_id: string | null
  hotel_id: string | null
  role: 'guest' | 'ai' | 'human'
  content: string
  media_url: string | null
  intent: string | null
  confidence: 'high' | 'medium' | 'low' | null
  escalation_required: boolean
  escalation_reason: string | null
  created_at: string
}

export interface Booking {
  id: string
  guest_id: string | null
  hotel_id: string | null
  room_type: string | null
  check_in: string | null
  check_out: string | null
  rate_per_night: number | null
  total_amount: number | null
  payment_status: string | null
  payment_method: string | null
  source: string | null
  kalakar_name: string | null
  status: string | null
  special_requests: string | null
  created_at: string
}

export interface Escalation {
  id: string
  conversation_id: string | null
  guest_id: string | null
  hotel_id: string | null
  reason: string | null
  resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface KnowledgeBaseEntry {
  id: string
  hotel_id: string | null
  category: string
  title: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AIResponse {
  response: string
  intent: string
  confidence: 'high' | 'medium' | 'low'
  escalation_required: boolean
  escalation_reason: string
}

export type IntentType =
  | 'room_inquiry'
  | 'pricing'
  | 'amenities'
  | 'airport_travel'
  | 'booking'
  | 'special_request'
  | 'complaint'
  | 'general'
