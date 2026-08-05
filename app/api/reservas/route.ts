import { NextRequest, NextResponse } from 'next/server'
import { criarReserva, listarReservasPorCliente, listarReservasPendentes } from '@/lib/data/reservas'
import { pixProvider } from '@/lib/payments/pix'
import { buscarProduto } from '@/lib/data/produtos'
import { isStaff } from '@/lib/auth-staff'
import { clienteAutenticado } from '@/lib/sessao-cliente'
import { checarOrigem } from '@/lib/mesma-origem'
import { checarRateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pendentes = searchParams.get('pendentes')

  // Visão da staff: todas as compras pendentes.
  if (pendentes === '1') {
    if (!(await isStaff())) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
    }
    const reservas = await listarReservasPendentes()
    return NextResponse.json({ reservas })
  }

  // Cliente: só as PRÓPRIAS compras — clienteId vem do cookie assinado, nunca da query.
  const clienteId = await clienteAutenticado()
  if (!clienteId) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  const reservas = await listarReservasPorCliente(clienteId)
  return NextResponse.json({ reservas })
}

export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  const limite = checarRateLimit(req, 'reservas', 20, 60_000)
  if (limite) return limite

  const clienteId = await clienteAutenticado()
  if (!clienteId) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { produtoId, clienteNome, clienteTelefone, clienteEmail } = await req.json().catch(() => ({}))
  if (!produtoId || !clienteNome?.trim() || !clienteTelefone?.trim()) {
    return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 })
  }

  const resultado = await criarReserva({
    produtoId,
    clienteId,
    clienteNome: clienteNome.trim(),
    clienteTelefone: clienteTelefone.trim(),
    clienteEmail: clienteEmail || undefined,
  })

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
