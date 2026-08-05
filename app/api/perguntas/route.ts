import { NextRequest, NextResponse } from 'next/server'
import {
  criarPergunta,
  listarPerguntasAtivas,
  listarPerguntasDoCliente,
  TEXTO_MAX,
} from '@/lib/data/perguntas'
import { isStaff } from '@/lib/auth-staff'
import { clienteAutenticado } from '@/lib/sessao-cliente'
import { checarOrigem } from '@/lib/mesma-origem'
import { checarRateLimit } from '@/lib/rate-limit'

export async function GET() {
  // Staff vê todas as conversas ativas; cliente vê só as dela (id do cookie).
  if (await isStaff()) {
    return NextResponse.json({ perguntas: await listarPerguntasAtivas() })
  }

  const clienteId = await clienteAutenticado()
  if (!clienteId) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  return NextResponse.json({ perguntas: await listarPerguntasDoCliente(clienteId) })
}

/** Cliente abre uma pergunta nova. */
export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  const limite = checarRateLimit(req, 'perguntas', 20, 60_000)
  if (limite) return limite

  const clienteId = await clienteAutenticado()
  if (!clienteId) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { texto } = await req.json().catch(() => ({}))
  const limpo = (texto ?? '').trim().slice(0, TEXTO_MAX)
  if (!limpo) return NextResponse.json({ erro: 'Escreva sua pergunta.' }, { status: 400 })

  const pergunta = await criarPergunta(clienteId, limpo)
  return NextResponse.json({ pergunta }, { status: 201 })
}
