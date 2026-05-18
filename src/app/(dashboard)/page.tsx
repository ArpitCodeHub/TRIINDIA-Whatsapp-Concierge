import { getSupabaseAdmin } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/stat-card'
import { MessageSquare, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const [conversationsResult, guestsResult, escalationsResult, messagesResult] =
    await Promise.all([
      getSupabaseAdmin().from('conversations').select('id').eq('status', 'active'),
      getSupabaseAdmin().from('guests').select('id'),
      getSupabaseAdmin().from('escalations').select('id').eq('resolved', false),
      getSupabaseAdmin().from('messages').select('id').eq('role', 'ai'),
    ])

  const totalConversations = conversationsResult.data?.length || 0
  const totalGuests = guestsResult.data?.length || 0
  const activeEscalations = escalationsResult.data?.length || 0
  const aiHandled = messagesResult.data?.length || 0

  const { data: recentConversations } = await getSupabaseAdmin()
    .from('conversations')
    .select(`
      id,
      status,
      last_message_at,
      guests!inner (name, phone),
      messages (content, role, intent, escalation_required, created_at)
    `)
    .order('last_message_at', { ascending: false })
    .limit(10)

  type ConvRow = {
    id: string
    status: string
    last_message_at: string
    guests: { name: string | null; phone: string } | null
    messages: { content: string; role: string; intent: string | null; escalation_required: boolean; created_at: string }[] | null
  }

  const typedConversations = (recentConversations || []) as unknown as ConvRow[]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Conversations"
          value={totalConversations}
          icon={MessageSquare}
          change="Currently active"
        />
        <StatCard
          title="Total Guests"
          value={totalGuests}
          icon={Users}
          change="In database"
        />
        <StatCard
          title="AI Handled"
          value={aiHandled}
          icon={CheckCircle}
          change="Auto-replied"
          changeType="positive"
        />
        <StatCard
          title="Pending Escalations"
          value={activeEscalations}
          icon={AlertTriangle}
          change="Needs attention"
          changeType={activeEscalations > 0 ? 'negative' : 'positive'}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Conversations
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {!typedConversations.length ? (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No conversations yet. Messages will appear here when guests reach out.
            </div>
          ) : (
            typedConversations.map((conv) => {
              const guest = conv.guests
              const lastMsg = conv.messages?.[0]
              return (
                <Link
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {guest?.name || 'Unknown Guest'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {lastMsg?.content || 'No messages yet'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {conv.status === 'escalated' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          Escalated
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
