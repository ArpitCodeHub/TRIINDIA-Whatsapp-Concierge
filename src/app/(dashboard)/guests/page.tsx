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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guests</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Guests</CardTitle>
        </CardHeader>
        <CardContent>
          {!guestsList.length ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No guests yet</p>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
