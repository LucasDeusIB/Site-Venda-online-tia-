import { NextRequest, NextResponse } from 'next/server'
import { criarReserva, listarReservasPorCliente, listarReservasPendentes } from '@/lib/data/reservas'
import { pixProvider } from '@/lib/payments/pix'
import { buscarProduto } from '@/lib/data/produtos'
import { isStaff } from '@/lib/auth-staff'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clienteId = searchParams.get('clienteId')
  const pendentes = searchParams.get('pendentes')

  // A client may only read their OWN purchases.
  if (clienteId) {
    const reservas = await listarReservasPorCliente(clienteId)
    return NextResponse.json({ reservas })
  }

  // Listing all pending purchases is a staff-only view (panel).
  if (pendentes === '1') {
    if (!(await isStaff())) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
    }
    const reservas = await listarReservasPendentes()
    return NextResponse.json({ reservas })
  }

  return NextResponse.json({ erro: 'Parâmetro obrigatório' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const { produtoId, clienteId, clienteNome, clienteTelefone, clienteEmail } = await req.json()

  if (!produtoId || !clienteId || !clienteNome || !clienteTelefone) {
    return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 })
  }

  const resultado = await criarReserva({ produtoId, clienteId, clienteNome, clienteTelefone, clienteEmail })

  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro }, { status: 409 })
  }

  // PIX manual: devolve a chave da importadora para a cliente pagar por fora.
  const produto = await buscarProduto(produtoId)
  const cobranca = await pixProvider.criarCobranca({
    valorBRL: produto?.precoVendaBRL ?? 0,
    reservaId: resultado.reserva.id,
    descricao: produto?.nome ?? 'Produto Compras da Ca e Dani',
  })

  return NextResponse.json({ reserva: resultado.reserva, pix: cobranca.payload }, { status: 201 })
}
