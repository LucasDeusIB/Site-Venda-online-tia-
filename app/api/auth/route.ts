import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PAINEL_COOKIE, hashPainel, comparaConstante, senhaPainel } from '@/lib/auth-staff'
import { checarOrigem } from '@/lib/mesma-origem'
import { checarRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  // Freio de força-bruta na senha do painel: 5 tentativas por minuto por IP.
  const limite = checarRateLimit(req, 'auth', 5, 60_000)
  if (limite) return limite

  const { password } = await req.json().catch(() => ({ password: '' }))
  const esperada = senhaPainel()

  if (typeof password !== 'string' || !comparaConstante(password, esperada)) {
    return NextResponse.json({ erro: 'Senha incorreta' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(PAINEL_COOKIE, await hashPainel(esperada), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  const cookieStore = await cookies()
  cookieStore.delete(PAINEL_COOKIE)
  return NextResponse.json({ ok: true })
}
