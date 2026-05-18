import { getSupabaseAdmin } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const intentLabels: Record<string, string> = {
  room_inquiry: 'Room Inquiry',
  pricing: 'Pricing',
  amenities: 'Amenities',
  airport_travel: 'Airport Travel',
  booking: 'Booking',
  special_request: 'Special Request',
  complaint: 'Complaint',
  general: 'General',
}

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const statusFilter = params.status
  const searchQuery = params.search

  let query = getSupabaseAdmin()
    .from('conversations')
    .select(`
      id,
      status,
      last_message_at,
      guests!inner (name, phone),
      messages (content, role, intent, escalation_required, created_at)
    `)
    .order('last_message_at', { ascending: false })
    .limit(100)

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: conversations } = await query

  const filtered = conversations?.filter((conv: any) => {
    if (!searchQuery) return true
    const guest = conv.guests
    const lastMsg = conv.messages?.[0]
    const searchable = `${guest?.name || ''} ${guest?.phone || ''} ${lastMsg?.content || ''}`.toLowerCase()
    return searchable.includes(searchQuery.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conversations</h1>
        <div className="flex items-center gap-3">
          <form className="flex items-center gap-2">
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Search guests..."
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            <select
              name="status"
              defaultValue={statusFilter || 'all'}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
            </select>
            <Button type="submit" variant="primary" size="sm">
              Filter
            </Button>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {!filtered?.length ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            No conversations found.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((conv: any) => {
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {guest?.name || 'Unknown'}
                        </p>
                        {conv.status === 'escalated' && (
                          <Badge variant="danger">Escalated</Badge>
                        )}
                        {lastMsg?.role === 'human' && (
                          <Badge variant="info">Human</Badge>
                        )}
                        {lastMsg?.intent && (
                          <Badge variant="default">
                            {intentLabels[lastMsg.intent] || lastMsg.intent}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {lastMsg?.content || 'No messages'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{guest?.phone}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-400">
                        {new Date(conv.last_message_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
