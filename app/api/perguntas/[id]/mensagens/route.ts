import { NextRequest, NextResponse } from 'next/server'
import { buscarPergunta, responderPergunta, TEXTO_MAX } from '@/lib/data/perguntas'
import { isStaff } from '@/lib/auth-staff'
import { clienteAutenticado } from '@/lib/sessao-cliente'
import { checarOrigem } from '@/lib/mesma-origem'
import { checarRateLimit } from '@/lib/rate-limit'

// Continua uma conversa: a staff responde qualquer uma; a cliente só a dela
// (a conversa tem que ser do clienteId do cookie assinado).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  const limite = checarRateLimit(req, 'perguntas-mensagens', 30, 60_000)
  if (limite) return limite

  const { id } = await params
  const { texto } = await req.json().catch(() => ({}))
  const limpo = (texto ?? '').trim().slice(0, TEXTO_MAX)
  if (!limpo) return NextResponse.json({ erro: 'Escreva uma mensagem.' }, { status: 400 })

  const pergunta = await buscarPergunta(id)
  if (!pergunta) return NextResponse.json({ erro: 'Pergunta não encontrada' }, { status: 404 })

  if (await isStaff()) {
    return NextResponse.json({ pergunta: await responderPergunta(id, 'staff', limpo) })
  }

  const clienteId = await clienteAutenticado()
  if (!clienteId || clienteId !== pergunta.clienteId) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  return NextResponse.json({ pergunta: await responderPergunta(id, 'cliente', limpo) })
}
