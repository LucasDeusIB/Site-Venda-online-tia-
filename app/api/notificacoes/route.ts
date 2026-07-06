import { NextResponse } from 'next/server'
import { getNotificacoes } from '@/lib/data/notificacoes'
import { getClienteIdSessao } from '@/lib/sessao-cliente'

export async function GET() {
  // Scoped by the signed session cookie. No session → no dots (never an error,
  // so the floating nav keeps working for anonymous visitors).
  const clienteId = await getClienteIdSessao()
  if (!clienteId) {
    return NextResponse.json({ aoVivo: false, pedir: false, minhasCompras: false })
  }

  const notificacoes = await getNotificacoes(clienteId)
  return NextResponse.json(notificacoes)
}
