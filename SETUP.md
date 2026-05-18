# TRIINDIA Hospitality — AI WhatsApp Concierge Platform

Production-ready AI WhatsApp concierge + CRM dashboard for TRIINDIA Hospitality.

## Stack

- **Frontend**: Next.js 15 + React + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter (OpenAI GPT-4o)
- **Messaging**: Meta WhatsApp Cloud API

---

## Quick Start

### 1. Install Dependencies

```bash
cd triindia-concierge
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Copy the contents of `supabase/migrations/001_initial_schema.sql` and run it
4. This creates all tables, indexes, triggers, and seed data (J Residency + KB entries)

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Meta WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=         # From Meta Developer Console
WHATSAPP_ACCESS_TOKEN=            # From Meta Developer Console
WHATSAPP_VERIFY_TOKEN=            # Your custom verify token (any string)

# OpenRouter
OPENROUTER_API_KEY=                   # From openrouter.ai/keys

# Supabase
NEXT_PUBLIC_SUPABASE_URL=         # From Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # From Supabase project settings
SUPABASE_SERVICE_ROLE_KEY=        # From Supabase project settings

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@triindia.in
ADMIN_PASSWORD=change_this_password

# Manager notification WhatsApp number (country code, no +)
MANAGER_WHATSAPP_NUMBER=919899402024
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Login with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

---

## Meta WhatsApp Cloud API Setup

### 1. Create Meta Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app → Type: **Business** → Name: **TRIINDIA Concierge**
3. Add **WhatsApp** product to your app

### 2. Get Credentials

1. In your app dashboard, find your **Phone Number ID** and **Access Token**
2. Set a **Verify Token** (any string you choose, e.g., `triindia-webhook-2024`)
3. Add these to your `.env`

### 3. Configure Webhook

1. In Meta Developer Console → WhatsApp → Configuration → Webhook
2. Click **Edit** and set:
   - **Callback URL**: `https://your-domain.com/api/webhook`
   - **Verify Token**: Same as your `WHATSAPP_VERIFY_TOKEN`
3. Subscribe to these fields: `messages`

### 4. Test with Sandbox

Before going live, use the Meta sandbox number to test:
- Add your personal WhatsApp number as a test recipient in the Meta console
- Send a message to the sandbox number
- Check your dashboard for the conversation

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

1. Push your code to GitHub
2. Connect your repo on [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Deploy

After deployment, update the webhook URL in Meta Developer Console to your Vercel URL:
`https://your-app.vercel.app/api/webhook`

---

## Project Structure

```
triindia-concierge/
├── src/
│   ├── app/
│   │   ├── (dashboard)/           # Protected dashboard pages
│   │   │   ├── page.tsx           # Overview / home
│   │   │   ├── layout.tsx         # Dashboard shell (sidebar + header)
│   │   │   ├── conversations/     # Module A — Conversations inbox
│   │   │   ├── guests/            # Module B — Guest profiles
│   │   │   ├── analytics/         # Module C — Analytics
│   │   │   ├── knowledge-base/    # Module D — KB manager
│   │   │   └── settings/          # System settings
│   │   ├── api/
│   │   │   ├── webhook/           # WhatsApp webhook (GET verify + POST)
│   │   │   ├── ai-reply/          # AI response generation
│   │   │   ├── escalate/          # Manual escalation
│   │   │   ├── send-message/      # Outbound WhatsApp send
│   │   │   └── auth/login/        # Admin login
│   │   ├── login/                 # Login page
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Redirect to dashboard or login
│   ├── lib/
│   │   ├── supabase/              # Supabase clients (server + browser)
│   │   ├── whatsapp/              # WhatsApp send utility
│   │   ├── ai/                    # OpenAI client + prompt builder
│   │   ├── memory/                # Guest context fetcher
│   │   └── knowledge/             # Knowledge base fetcher
│   ├── components/
│   │   ├── dashboard/             # Sidebar, header, stat cards
│   │   ├── conversations/         # Conversation UI
│   │   ├── guests/                # Guest profile UI
│   │   ├── analytics/             # Analytics charts
│   │   ├── knowledge/             # KB editor
│   │   └── ui/                    # Reusable primitives
│   ├── types/                     # TypeScript types + DB schema
│   └── middleware.ts              # Auth middleware
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # Full DB schema + seed data
├── .env.example
└── SETUP.md
```

---

## How It Works

### Incoming Message Flow

1. Guest sends WhatsApp message → Meta Cloud API
2. Meta sends webhook POST → `/api/webhook`
3. Webhook extracts phone, name, message
4. Upserts guest in database
5. Finds or creates conversation
6. Stores guest message
7. **Immediately returns 200** (Meta requires <15s)
8. **In background**: fires `/api/ai-reply`

### AI Reply Flow

1. Fetches last 20 messages for context
2. Fetches guest profile (stays, preferences, VIP status)
3. Fetches active booking if any
4. Fetches all active knowledge base entries
5. Builds prompt with system instructions + KB + history + guest context
6. Calls OpenAI GPT-4o-mini with JSON output mode
7. Parses structured response: `{response, intent, confidence, escalation_required, escalation_reason}`
8. Stores AI response in database
9. Sends WhatsApp reply via Meta API
10. If escalation needed:
    - Updates conversation status to `escalated`
    - Creates escalation record
    - Sends WhatsApp alert to manager

### Escalation Flow

- **Auto**: AI detects low confidence, complaint, or booking change → escalates
- **Manual**: Staff clicks "Escalate" button in dashboard → creates escalation record + alerts manager

---

## Database Schema

| Table | Purpose |
|---|---|
| `hotels` | Hotel properties (multi-tenant ready) |
| `guests` | Guest profiles with phone, preferences, VIP status |
| `conversations` | Conversation threads (active/escalated/resolved) |
| `messages` | Individual messages with intent, confidence, escalation flags |
| `bookings` | Booking records linked to guests |
| `escalations` | Escalation tracking with resolution status |
| `knowledge_base` | AI knowledge base entries (editable via admin CMS) |

---

## AI Concierge Personality

The AI is configured to:
- Be warm, professional, and conversational
- Support Hindi + English naturally (mirrors guest language)
- Keep responses concise (2-4 sentences, WhatsApp-friendly)
- Use emojis sparingly (😊 🌟 ✨)
- **NEVER hallucinate** — uses only the knowledge base
- Escalate uncertainty politely

### Intent Classification

Every AI response includes an intent:
- `room_inquiry` — Room availability questions
- `pricing` — Rate and cost inquiries
- `amenities` — Facilities and services
- `airport_travel` — Transport from airport
- `booking` — Booking related
- `special_request` — Custom requests
- `complaint` — Issues and complaints
- `general` — General conversation

---

## Knowledge Base Management

The admin CMS (Module D) lets you:
- Create, edit, delete KB entries
- Categorize entries (hotel_info, policy, room, pricing, amenity, travel, faq, escalation_rule, sop)
- Toggle entries active/inactive
- Filter by category

The AI receives **all active KB entries** in its prompt on every message. Keep entries concise and accurate.

---

## Adding a New Hotel

1. Insert into `hotels` table (or use SQL):
```sql
insert into hotels (name, slug, address, phone, email)
values ('Hotel Name', 'hotel-slug', 'Address', '+91...', 'email@...');
```

2. Add KB entries for the new hotel with the new hotel's ID
3. The system is multi-hotel ready — conversations and guests are linked to hotels

---

## Troubleshooting

### Webhook not receiving messages
- Verify the webhook URL is correct in Meta Developer Console
- Check that `WHATSAPP_VERIFY_TOKEN` matches
- Check Vercel logs for errors

### AI not responding
- Check `OPENROUTER_API_KEY` is set correctly
- Check Vercel logs for `/api/ai-reply` errors
- Verify Supabase connection

### Messages not sending
- Check `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN`
- Verify the phone number is approved in Meta Developer Console
- Check Meta API rate limits

### Login not working
- Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`
- Clear browser cookies and try again

---

## Next Steps (Phase 1.5)

- Add Supabase Row Level Security for multi-role access
- Add more hotels
- Add pgvector for semantic KB search
- Add email notifications
- Add booking management UI
- Add Kalakar tracking module
- Add OTA recapture workflow
- Add pre-arrival / in-stay / post-stay automated flows
