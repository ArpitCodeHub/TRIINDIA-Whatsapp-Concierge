import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')

  const isLoginPage = request.nextUrl.pathname === '/login'
  const isDashboard = request.nextUrl.pathname.startsWith('/conversations') ||
    request.nextUrl.pathname.startsWith('/guests') ||
    request.nextUrl.pathname.startsWith('/analytics') ||
    request.nextUrl.pathname.startsWith('/knowledge-base') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname === '/'

  if (isDashboard && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoginPage && authToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/conversations/:path*', '/guests/:path*', '/analytics/:path*', '/knowledge-base/:path*', '/settings/:path*', '/login'],
}
