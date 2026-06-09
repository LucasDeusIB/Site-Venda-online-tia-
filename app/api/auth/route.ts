import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const expected = process.env.PANEL_PASSWORD ?? 'coreiq2024'

  if (password !== expected) {
    return NextResponse.json({ erro: 'Senha incorreta' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('painel_auth', await hashPassword(expected), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('painel_auth')
  return NextResponse.json({ ok: true })
}
