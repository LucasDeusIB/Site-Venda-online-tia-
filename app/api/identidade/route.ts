import { NextRequest, NextResponse } from 'next/server'
import { clienteAutenticado, encerrarSessao, iniciarSessao } from '@/lib/sessao-cliente'
import { autenticarConta, buscarConta, somenteDigitos } from '@/lib/data/clientes'
import { checarOrigem } from '@/lib/mesma-origem'
import { checarRateLimit } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ERRO_LOGIN = 'E-mail ou telefone incorreto.'

// Login. Não cria conta: o par (e-mail + telefone) precisa existir, gravado no
// "Cadastrar-se". Se não existir — ou se um dos dois estiver diferente — não
// entra. É o que fecha o buraco antigo, em que qualquer par digitado virava uma
// sessão válida.
export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  const limite = checarRateLimit(req, 'identidade', 15, 60_000)
  if (limite) return limite

  const { email, telefone } = await req.json().catch(() => ({}))
  if (!EMAIL_RE.test((email ?? '').trim()) || somenteDigitos(telefone ?? '').length < 10) {
    // Mesma mensagem do par errado: não entregamos pista de qual campo falhou.
    return NextResponse.json({ erro: ERRO_LOGIN }, { status: 401 })
  }

  const conta = await autenticarConta(email, telefone)
  if (!conta) return NextResponse.json({ erro: ERRO_LOGIN }, { status: 401 })

  await iniciarSessao(conta.clienteId)
  return NextResponse.json(conta)
}

/** Sessão atual (para as telas do cliente conferirem se ainda estão logadas). */
export async function GET() {
  const clienteId = await clienteAutenticado()
  if (!clienteId) return NextResponse.json({ erro: 'Sem sessão' }, { status: 401 })

  // Cookie válido mas conta apagada → derruba a sessão.
  const conta = await buscarConta(clienteId)
  if (!conta) {
    await encerrarSessao()
    return NextResponse.json({ erro: 'Sem sessão' }, { status: 401 })
  }

  return NextResponse.json(conta)
}

export async function DELETE(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  await encerrarSessao()
  return NextResponse.json({ ok: true })
}
