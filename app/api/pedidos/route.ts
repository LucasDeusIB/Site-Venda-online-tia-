import { NextRequest, NextResponse } from 'next/server'
import { listarPedidos, listarPedidosPorCliente, listarPedidosPorLoja, criarPedido } from '@/lib/data/pedidos'
import { isStaff } from '@/lib/auth-staff'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lojaId = searchParams.get('lojaId')
  const clienteId = searchParams.get('clienteId')

  // A client may only read their OWN orders (filtered by clienteId).
  if (clienteId) {
    const pedidos = await listarPedidosPorCliente(clienteId)
    return NextResponse.json({ pedidos })
  }

  // Listing everyone's orders (or a whole store's) is a staff-only view.
  if (!(await isStaff())) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const pedidos = lojaId ? await listarPedidosPorLoja(lojaId) : await listarPedidos()
  return NextResponse.json({ pedidos })
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  const pedido = await criarPedido(data)
  return NextResponse.json({ pedido }, { status: 201 })
}
