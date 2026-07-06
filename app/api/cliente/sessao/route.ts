import { NextRequest, NextResponse } from 'next/server'
import { gerarClienteId } from '@/lib/cliente'
import { definirSessaoCliente, limparSessaoCliente } from '@/lib/sessao-cliente'
import { verificarLimite, ipDaRequisicao } from '@/lib/rate-limit'

// Establishes a signed client session from the identity the buyer typed at the
// front door (name + email + phone). The server derives the clienteId itself and
// stores it in an httpOnly signed cookie — the client never gets to choose which
// clienteId it is read as. Identity stays passwordless by design.
export async function POST(req: NextRequest) {
  const limite = verificarLimite(`sessao:${ipDaRequisicao(req)}`, { max: 40, janelaMs: 60_000 })
  if (!limite.ok) {
    return NextResponse.json({ erro: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 })
  }

  const { nome, email, telefone } = await req.json().catch(() => ({}))

  // Phone is the anchor of the identity; email is optional (some flows capture it
  // later). Mirrors how gerarClienteId is fed on the client.
  const digitos = String(telefone ?? '').replace(/\D/g, '')
  if (!String(nome ?? '').trim() || digitos.length < 10) {
    return NextResponse.json({ erro: 'Nome e telefone válidos são obrigatórios.' }, { status: 400 })
  }

  const clienteId = gerarClienteId(String(email ?? ''), String(telefone))
  await definirSessaoCliente(clienteId)
  return NextResponse.json({ clienteId })
}

export async function DELETE() {
  await limparSessaoCliente()
  return NextResponse.json({ ok: true })
}
