import { NextRequest, NextResponse } from 'next/server'

// MESMA fórmula de lib/auth-staff.ts (senha + SESSION_SECRET). Web Crypto para
// rodar no Edge. Se mudar uma, mude a outra.
async function hashPainel(password: string): Promise<string> {
  const segredo = process.env.SESSION_SECRET ?? ''
  const encoder = new TextEncoder()
  const data = encoder.encode(`${segredo}:${password}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function comparaConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/painel')) return NextResponse.next()
  if (pathname === '/painel/login') return NextResponse.next()

  const cookie = request.cookies.get('painel_auth')
  const expectedHash = await hashPainel(process.env.PANEL_PASSWORD ?? '12345')

  if (!cookie || !comparaConstante(cookie.value, expectedHash)) {
    // Single front door: unauthenticated panel visits go back to the entry screen.
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/painel/:path*'],
}
