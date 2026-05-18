-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Hotels
create table if not exists hotels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  address text,
  phone text,
  email text,
  check_in_time time default '14:00',
  check_out_time time default '12:00',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Guests
create table if not exists guests (
  id uuid primary key default uuid_generate_v4(),
  phone text unique not null,
  name text,
  email text,
  hotel_id uuid references hotels(id),
  total_stays int default 0,
  last_stay_date date,
  lifetime_value numeric default 0,
  preferred_language text default 'en',
  preferences jsonb default '{}',
  is_vip boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conversations
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid references guests(id) on delete cascade,
  hotel_id uuid references hotels(id),
  status text default 'active',
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Messages
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade,
  guest_id uuid references guests(id),
  hotel_id uuid references hotels(id),
  role text not null,
  content text not null,
  media_url text,
  intent text,
  confidence text,
  escalation_required boolean default false,
  escalation_reason text,
  created_at timestamptz default now()
);

-- Bookings
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid references guests(id),
  hotel_id uuid references hotels(id),
  room_type text,
  check_in date,
  check_out date,
  rate_per_night numeric,
  total_amount numeric,
  payment_status text,
  payment_method text,
  source text,
  kalakar_name text,
  status text,
  special_requests text,
  created_at timestamptz default now()
);

-- Escalations
create table if not exists escalations (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id),
  guest_id uuid references guests(id),
  hotel_id uuid references hotels(id),
  reason text,
  resolved boolean default false,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- Knowledge Base
create table if not exists knowledge_base (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id),
  category text not null,
  title text not null,
  content text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_messages_conversation on messages(conversation_id, created_at desc);
create index if not exists idx_messages_guest on messages(guest_id);
create index if not exists idx_messages_hotel on messages(hotel_id);
create index if not exists idx_conversations_guest on conversations(guest_id);
create index if not exists idx_conversations_hotel on conversations(hotel_id);
create index if not exists idx_conversations_status on conversations(status);
create index if not exists idx_bookings_guest on bookings(guest_id);
create index if not exists idx_bookings_hotel on bookings(hotel_id);
create index if not exists idx_guests_phone on guests(phone);
create index if not exists idx_kb_hotel_category on knowledge_base(hotel_id, category);
create index if not exists idx_escalations_resolved on escalations(resolved);

-- Function to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_hotels_updated_at before update on hotels for each row execute function update_updated_at_column();
create trigger update_guests_updated_at before update on guests for each row execute function update_updated_at_column();
create trigger update_kb_updated_at before update on knowledge_base for each row execute function update_updated_at_column();

-- Seed: J Residency
insert into hotels (id, name, slug, address, phone, email) values
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'J Residency', 'j-residency', 'Jangpura B, New Delhi, Delhi 110014', '+919899402024', 'info@jresidency.in')
on conflict (slug) do nothing;

-- Seed: Knowledge Base entries for J Residency
insert into knowledge_base (hotel_id, category, title, content) values
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'hotel_info', 'Hotel Name & Location', 'J Residency is located in Jangpura B, New Delhi. It is a comfortable hotel catering to both business and leisure travelers.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'hotel_info', 'Address', 'J Residency, Jangpura B, New Delhi, Delhi 110014, India'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'policy', 'Check-in Policy', 'Check-in time is 2:00 PM. Early check-in is subject to room availability. Guests must provide valid government-issued photo ID at check-in.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'policy', 'Check-out Policy', 'Check-out time is 12:00 PM (noon). Late check-out may be available upon request and is subject to availability.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'policy', 'Cancellation Policy', 'Cancellation policies vary by booking type. Please contact our team for specific cancellation terms for your reservation.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'policy', 'Pet Policy', 'Pets are not allowed at J Residency.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'policy', 'Smoking Policy', 'J Residency is a non-smoking property. Smoking is not permitted inside rooms or common areas.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'policy', 'Children Policy', 'Children of all ages are welcome. Extra beds can be arranged for children at additional cost.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'room', 'Deluxe Room', 'Our Deluxe Room offers a comfortable stay with AC, TV, WiFi, and attached bathroom. Suitable for 2 guests. Extra bed available at additional cost.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'room', 'Executive Room', 'Our Executive Room features a larger space with a dedicated workspace, high-speed WiFi, AC, TV, and premium bathroom amenities. Suitable for 2 guests.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'room', 'Family Room', 'Our Family Room is designed for families with extra space, multiple beds, AC, TV, WiFi, and all standard amenities. Suitable for 3-4 guests.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'pricing', 'Room Rates Note', 'Room rates vary by season and availability. All rates are subject to 5% GST. For current pricing, our team will confirm rates when you share your dates. Extra bed available at additional cost.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'amenity', 'WiFi', 'Complimentary high-speed WiFi is available throughout the hotel for all guests.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'amenity', 'Air Conditioning', 'All rooms are equipped with air conditioning.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'amenity', 'Breakfast', 'Breakfast is available. Vegetarian and non-vegetarian options can be arranged. Please share your preference in advance.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'amenity', 'Parking', 'Parking information is available. Please contact the hotel for parking details.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'amenity', 'Extra Bed', 'Extra beds are available in all room categories at additional cost. Please request at the time of booking or during your stay.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'travel', 'Airport Distance', 'J Residency is 35-45 minutes from IGI Airport via Uber or Ola. Estimated fare: ₹500-₹800 depending on time of day.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'travel', 'Getting from IGI Airport', 'From IGI Airport, you can take Uber or Ola to J Residency. The ride takes approximately 35-45 minutes and costs ₹500-₹800. Avoid unregistered taxi touts at the airport. Pre-paid taxi counters are available inside the terminal.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'travel', 'Nearby Landmarks', 'J Residency is conveniently located near Jangpura Metro Station, Nizamuddin Railway Station, and is accessible to Connaught Place, India Gate, and Khan Market.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'faq', 'What ID is required for check-in?', 'All guests must provide a valid government-issued photo ID at check-in. Accepted IDs: Aadhaar Card, PAN Card, Passport, Driving License, or Voter ID. Foreign nationals must present their passport and visa.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'faq', 'Is the area safe?', 'Jangpura is a well-established, safe residential area in South Delhi. The hotel is in a secure neighborhood with easy access to main roads and public transport.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'faq', 'Do you accept online payment?', 'Yes, we accept UPI, credit/debit cards, net banking, and cash payments. Online payments can be made via our secure payment link.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'faq', 'Can I modify my booking?', 'Booking modifications can be handled by our team. Please share your booking details and the changes you would like to make.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'escalation_rule', 'When to Escalate', 'Escalate to human staff when: guest explicitly asks for human support, guest expresses anger or frustration, booking modification or cancellation is requested, payment issues are mentioned, AI confidence is low, or question is not covered in the knowledge base.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'sop', 'AI Response Guidelines', 'AI should respond warmly and professionally in a conversational tone. Keep responses concise and WhatsApp-friendly (2-4 sentences). Use emojis sparingly. Mirror guest language (Hindi or English). Never hallucinate room rates or availability. For pricing/availability, acknowledge the request and mention the team will confirm.')
on conflict do nothing;
