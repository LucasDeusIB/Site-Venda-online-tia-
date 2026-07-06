import { NextRequest, NextResponse } from 'next/server'
import { criarReserva, listarReservasPorCliente, listarReservasPendentes } from '@/lib/data/reservas'
import { pixProvider } from '@/lib/payments/pix'
import { buscarProduto } from '@/lib/data/produtos'
import { isStaff } from '@/lib/auth-staff'
import { gerarClienteId } from '@/lib/cliente'
import { getClienteIdSessao, definirSessaoCliente } from '@/lib/sessao-cliente'
import { verificarLimite, ipDaRequisicao } from '@/lib/rate-limit'

export async function GET() {
  // Staff credential wins: the panel's pending-purchases view. Checked first so an
  // operator who also has a client session still sees the panel data.
  if (await isStaff()) {
    const reservas = await listarReservasPendentes()
    return NextResponse.json({ reservas })
  }

  // A client reads their OWN purchases — scoped by the SIGNED session cookie.
  const clienteId = await getClienteIdSessao()
  if (clienteId) {
    const reservas = await listarReservasPorCliente(clienteId)
    return NextResponse.json({ reservas })
  }

  return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
}

export async function POST(req: NextRequest) {
  const limite = verificarLimite(`reserva:${ipDaRequisicao(req)}`, { max: 20, janelaMs: 60_000 })
  if (!limite.ok) {
    return NextResponse.json({ erro: 'Muitas compras seguidas. Aguarde um momento.' }, { status: 429 })
  }

  const { produtoId, clienteNome, clienteTelefone, clienteEmail } = await req.json()

  if (!produtoId || !String(clienteNome ?? '').trim() || !String(clienteTelefone ?? '').trim()) {
    return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 })
  }

  // clienteId derived server-side (or from an existing session): the buyer cannot
  // register a purchase under someone else's identity.
  const clienteId = (await getClienteIdSessao()) ?? gerarClienteId(String(clienteEmail ?? ''), String(clienteTelefone))
  await definirSessaoCliente(clienteId)

  const resultado = await criarReserva({
    produtoId,
    clienteId,
    clienteNome: String(clienteNome).trim(),
    clienteTelefone: String(clienteTelefone).trim(),
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
