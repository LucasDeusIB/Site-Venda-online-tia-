import { NextResponse } from 'next/server'
import { getNotificacoes } from '@/lib/data/notificacoes'
import { clienteAutenticado } from '@/lib/sessao-cliente'

export async function GET() {
  // clienteId vem do cookie assinado, nunca da query (evita ler dados de outro).
  const clienteId = await clienteAutenticado()
  if (!clienteId) {
    return NextResponse.json({ aoVivo: false, pedir: false, minhasCompras: false })
  }

  const notificacoes = await getNotificacoes(clienteId)
  return NextResponse.json(notificacoes)
}
