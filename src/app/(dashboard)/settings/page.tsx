import { getSupabaseAdmin } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SettingsPage() {
  const { data: hotels } = await getSupabaseAdmin().from('hotels').select('*').eq('is_active', true)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Hotels</CardTitle>
        </CardHeader>
        <CardContent>
          {!hotels?.length ? (
            <p className="text-gray-500 dark:text-gray-400">No hotels configured</p>
          ) : (
            <div className="space-y-3">
              {hotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <p className="font-medium text-gray-900 dark:text-white">{hotel.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{hotel.address}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{hotel.phone}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Check-in: {hotel.check_in_time} | Check-out: {hotel.check_out_time}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Webhook URL</p>
            <p className="text-sm font-mono text-gray-900 dark:text-white mt-1">
              {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Configure this URL in your Meta WhatsApp Cloud API app settings.
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Verify Token</p>
            <p className="text-sm font-mono text-gray-900 dark:text-white mt-1">
              {process.env.WHATSAPP_VERIFY_TOKEN ? '••••••••' : 'Not set'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">OpenRouter API</span>
              <span
                className={`text-sm font-medium ${
                  process.env.OPENROUTER_API_KEY
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {process.env.OPENROUTER_API_KEY ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">WhatsApp API</span>
              <span
                className={`text-sm font-medium ${
                  process.env.WHATSAPP_ACCESS_TOKEN
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {process.env.WHATSAPP_ACCESS_TOKEN ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Supabase</span>
              <span
                className={`text-sm font-medium ${
                  process.env.NEXT_PUBLIC_SUPABASE_URL
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not configured'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
