import { NextRequest, NextResponse } from 'next/server'
import { atualizarStatusPedido } from '@/lib/data/pedidos'
import { isStaff } from '@/lib/auth-staff'
import type { PedidoStatus } from '@/lib/data/types'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Only staff responds to / changes the status of an order.
  if (!(await isStaff())) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  const { status, respostaImportadora } = await req.json()
  const pedido = await atualizarStatusPedido(id, status as PedidoStatus, respostaImportadora)
  return NextResponse.json({ pedido })
}
