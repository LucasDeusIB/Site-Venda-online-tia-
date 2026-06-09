import { NextRequest, NextResponse } from 'next/server'
import { getNotificacoes } from '@/lib/data/notificacoes'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clienteId = searchParams.get('clienteId')

  if (!clienteId) {
    return NextResponse.json({ aoVivo: false, pedir: false, minhasCompras: false })
  }

  const notificacoes = await getNotificacoes(clienteId)
  return NextResponse.json(notificacoes)
}
