import { NextRequest, NextResponse } from 'next/server'
import { marcarVisto } from '@/lib/data/notificacoes'
import type { AbaNotificacao } from '@/lib/data/types'
import { clienteAutenticado } from '@/lib/sessao-cliente'
import { checarOrigem } from '@/lib/mesma-origem'

const ABAS_VALIDAS: AbaNotificacao[] = ['ao_vivo', 'pedir', 'minhas_compras', 'perguntas']

export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  const clienteId = await clienteAutenticado()
  if (!clienteId) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { aba } = await req.json().catch(() => ({}))
  if (!ABAS_VALIDAS.includes(aba)) {
    return NextResponse.json({ erro: 'aba inválida' }, { status: 400 })
  }

  await marcarVisto(clienteId, aba)
  return NextResponse.json({ ok: true })
}
