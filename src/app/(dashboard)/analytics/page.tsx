import { getSupabaseAdmin } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

export default async function AnalyticsPage() {
  const [
    totalMessages,
    aiMessages,
    guestMessages,
    escalationsResult,
    intentsResult,
    conversationsResult,
  ] = await Promise.all([
    getSupabaseAdmin().from('messages').select('id', { count: 'exact', head: true }),
    getSupabaseAdmin()
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'ai'),
    getSupabaseAdmin()
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'guest'),
    getSupabaseAdmin().from('escalations').select('id', { count: 'exact', head: true }),
    getSupabaseAdmin().from('messages').select('intent').not('intent', 'is', null),
    getSupabaseAdmin().from('conversations').select('id, created_at, last_message_at'),
  ])

  const totalMsg = totalMessages.count || 0
  const aiMsg = aiMessages.count || 0
  const guestMsg = guestMessages.count || 0
  const totalEscalations = escalationsResult.count || 0
  const aiHandledPct = totalMsg > 0 ? Math.round((aiMsg / totalMsg) * 100) : 0
  const escalationPct = totalMsg > 0 ? Math.round((totalEscalations / totalMsg) * 100) : 0

  const intentCounts: Record<string, number> = {}
  const intentData = (intentsResult.data || []) as { intent: string | null }[]
  intentData.forEach((m) => {
    if (m.intent) {
      intentCounts[m.intent] = (intentCounts[m.intent] || 0) + 1
    }
  })

  const sortedIntents = Object.entries(intentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  const maxIntentCount = sortedIntents.length > 0 ? sortedIntents[0][1] : 1

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Messages"
          value={totalMsg}
          icon={MessageSquare}
        />
        <StatCard
          title="AI Handled"
          value={`${aiHandledPct}%`}
          icon={CheckCircle}
          change={`${aiMsg} messages`}
          changeType="positive"
        />
        <StatCard
          title="Escalation Rate"
          value={`${escalationPct}%`}
          icon={AlertTriangle}
          change={`${totalEscalations} escalations`}
          changeType={escalationPct > 20 ? 'negative' : 'positive'}
        />
        <StatCard
          title="Total Conversations"
          value={conversationsResult.data?.length || 0}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Intents</CardTitle>
          </CardHeader>
          <CardContent>
            {!sortedIntents.length ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No intent data yet
              </p>
            ) : (
              <div className="space-y-3">
                {sortedIntents.map(([intent, count]) => (
                  <div key={intent} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-32 capitalize">
                      {intent.replace('_', ' ')}
                    </span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${(count / maxIntentCount) * 100}%` }}
                      >
                        <span className="text-xs text-white font-medium">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escalations Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Escalations</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {totalEscalations}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Guest Messages</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {guestMsg}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">AI Responses</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {aiMsg}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intent Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { intent: 'room_inquiry', desc: 'Room availability questions' },
              { intent: 'pricing', desc: 'Rate and cost inquiries' },
              { intent: 'amenities', desc: 'Facilities and services' },
              { intent: 'airport_travel', desc: 'Transport from airport' },
              { intent: 'booking', desc: 'Booking related' },
              { intent: 'special_request', desc: 'Custom requests' },
              { intent: 'complaint', desc: 'Issues and complaints' },
              { intent: 'general', desc: 'General conversation' },
            ].map((item) => (
              <div key={item.intent} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Badge variant="default" className="mb-1">
                  {item.intent.replace('_', ' ')}
                </Badge>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
