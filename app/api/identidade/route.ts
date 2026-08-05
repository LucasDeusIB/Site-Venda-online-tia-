import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { CLIENTE_COOKIE, gerarClienteId, tokenCliente } from '@/lib/sessao-cliente'
import { checarOrigem } from '@/lib/mesma-origem'
import { checarRateLimit } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Porta de entrada do cliente: recebe nome + e-mail + telefone, calcula o ID no
// servidor e devolve um cookie assinado. É o único jeito de obter um token
// válido — o cliente não consegue forjar o ID de outra pessoa.
export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  const limite = checarRateLimit(req, 'identidade', 15, 60_000)
  if (limite) return limite

  const { nome, email, telefone } = await req.json().catch(() => ({}))
  if (!nome?.trim()) return NextResponse.json({ erro: 'Informe seu nome' }, { status: 400 })
  if (!EMAIL_RE.test((email ?? '').trim())) {
    return NextResponse.json({ erro: 'E-mail inválido' }, { status: 400 })
  }
  if ((telefone ?? '').replace(/\D/g, '').length < 10) {
    return NextResponse.json({ erro: 'Telefone inválido' }, { status: 400 })
  }

  const clienteId = gerarClienteId(email, telefone)
  const store = await cookies()
  store.set(CLIENTE_COOKIE, tokenCliente(clienteId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })

  return NextResponse.json({
    clienteId,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    telefone: telefone.trim(),
  })
}

export async function DELETE(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  const store = await cookies()
  store.delete(CLIENTE_COOKIE)
  return NextResponse.json({ ok: true })
}
