import { getSupabaseAdmin } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function GuestProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [guestResult, conversationsResult, bookingsResult, messagesResult, escalationsResult] =
    await Promise.all([
      getSupabaseAdmin().from('guests').select('*').eq('id', id).single(),
      getSupabaseAdmin()
        .from('conversations')
        .select('id, status, last_message_at')
        .eq('guest_id', id)
        .order('last_message_at', { ascending: false }),
      getSupabaseAdmin()
        .from('bookings')
        .select('*')
        .eq('guest_id', id)
        .order('check_in', { ascending: false }),
      getSupabaseAdmin()
        .from('messages')
        .select('*, conversations!inner(status)')
        .eq('guest_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      getSupabaseAdmin()
        .from('escalations')
        .select('*')
        .eq('guest_id', id)
        .order('created_at', { ascending: false }),
    ])

  const guest = guestResult.data as any
  if (!guest) {
    return <div className="p-6 text-gray-500">Guest not found</div>
  }

  const bookings = (bookingsResult.data || []) as any[]
  const messages = (messagesResult.data || []) as any[]
  const escalations = (escalationsResult.data || []) as any[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {guest.name || 'Unknown Guest'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{guest.phone}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Stays</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{guest.total_stays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Lifetime Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₹{guest.lifetime_value.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Stay</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {guest.last_stay_date
                ? new Date(guest.last_stay_date).toLocaleDateString()
                : 'N/A'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <div className="mt-1">
              {guest.is_vip ? (
                <Badge variant="warning">VIP Guest</Badge>
              ) : (
                <Badge variant="default">Regular</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          {!messages.length ? (
            <p className="text-gray-500 dark:text-gray-400">No messages</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg text-sm ${
                    msg.role === 'guest'
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'bg-blue-50 dark:bg-blue-900/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {msg.role === 'guest' ? 'Guest' : msg.role === 'ai' ? 'AI' : 'Human'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{msg.content}</p>
                  {msg.intent && (
                    <Badge variant="default" className="mt-1">
                      {msg.intent}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
        </CardHeader>
        <CardContent>
          {!bookings.length ? (
            <p className="text-gray-500 dark:text-gray-400">No bookings</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {booking.room_type || 'Room'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.check_in} → {booking.check_out}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ₹{booking.total_amount || booking.rate_per_night || 0}
                    </p>
                    <Badge
                      variant={
                        booking.status === 'checked_out'
                          ? 'success'
                          : booking.status === 'cancelled'
                          ? 'danger'
                          : 'info'
                      }
                    >
                      {booking.status || 'unknown'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {escalations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Escalations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {escalations.map((esc) => (
                <div
                  key={esc.id}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {esc.reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(esc.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={esc.resolved ? 'success' : 'danger'}>
                    {esc.resolved ? 'Resolved' : 'Open'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Link
          href="/guests"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Guests
        </Link>
      </div>
    </div>
  )
}
