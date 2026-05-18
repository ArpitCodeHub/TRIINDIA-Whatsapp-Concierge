import { getSupabaseAdmin } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'

export default async function GuestsPage() {
  const { data: guestsData } = await getSupabaseAdmin()
    .from('guests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const guestsList = (guestsData || []) as any[]

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Guests</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Guests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!guestsList.length ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">No guests yet</p>
          ) : (
            <>
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Stays</TableHead>
                      <TableHead>VIP</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>First Contact</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guestsList.map((guest: any) => (
                      <TableRow key={guest.id}>
                        <TableCell className="font-medium">{guest.name || 'Unknown'}</TableCell>
                        <TableCell>{guest.phone}</TableCell>
                        <TableCell>{guest.total_stays}</TableCell>
                        <TableCell>
                          {guest.is_vip ? (
                            <Badge variant="warning">VIP</Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>{guest.preferred_language === 'hi' ? 'Hindi' : 'English'}</TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(guest.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/guests/${guest.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {guestsList.map((guest: any) => (
                  <Link
                    key={guest.id}
                    href={`/guests/${guest.id}`}
                    className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {guest.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{guest.phone}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {guest.is_vip && <Badge variant="warning" className="text-xs">VIP</Badge>}
                        <span className="text-xs text-gray-400">{guest.total_stays} stays</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
