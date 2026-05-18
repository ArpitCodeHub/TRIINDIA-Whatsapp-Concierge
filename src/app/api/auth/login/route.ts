import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password } = body

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (email === adminEmail && password === adminPassword) {
    const cookieStore = await cookies()
    cookieStore.set('auth_token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
