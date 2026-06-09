import { NextRequest, NextResponse } from 'next/server'
import { marcarVisto } from '@/lib/data/notificacoes'
import type { AbaNotificacao } from '@/lib/data/types'

const ABAS_VALIDAS: AbaNotificacao[] = ['ao_vivo', 'pedir', 'minhas_compras']

export async function POST(req: NextRequest) {
  const { clienteId, aba } = await req.json()

  if (!clienteId || !ABAS_VALIDAS.includes(aba)) {
    return NextResponse.json({ erro: 'clienteId e aba são obrigatórios' }, { status: 400 })
  }

  await marcarVisto(clienteId, aba)
  return NextResponse.json({ ok: true })
}
