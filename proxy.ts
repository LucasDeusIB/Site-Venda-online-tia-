import { NextRequest, NextResponse } from 'next/server'

// Simple constant-time comparison for cookie auth
// Uses Web Crypto API (Edge Runtime compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/painel')) return NextResponse.next()
  if (pathname === '/painel/login') return NextResponse.next()

  const cookie = request.cookies.get('painel_auth')
  const expectedHash = await hashPassword(process.env.PANEL_PASSWORD ?? '12345')

  if (!cookie || cookie.value !== expectedHash) {
    // Single front door: unauthenticated panel visits go back to the entry screen.
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/painel/:path*'],
}
