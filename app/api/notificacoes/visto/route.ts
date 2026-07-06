import { NextRequest, NextResponse } from 'next/server'
import { marcarVisto } from '@/lib/data/notificacoes'
import { getClienteIdSessao } from '@/lib/sessao-cliente'
import type { AbaNotificacao } from '@/lib/data/types'

const ABAS_VALIDAS: AbaNotificacao[] = ['ao_vivo', 'pedir', 'minhas_compras']

export async function POST(req: NextRequest) {
  const { aba } = await req.json()

  // Which tab was seen comes from the body; WHO saw it comes from the signed
  // session — a client can only clear their own dots.
  const clienteId = await getClienteIdSessao()
  if (!clienteId) {
    return NextResponse.json({ ok: true }) // anonymous: nothing to mark
  }
  if (!ABAS_VALIDAS.includes(aba)) {
    return NextResponse.json({ erro: 'aba inválida' }, { status: 400 })
  }

  await marcarVisto(clienteId, aba)
  return NextResponse.json({ ok: true })
}
