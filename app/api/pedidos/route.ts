import { NextRequest, NextResponse } from 'next/server'
import { listarPedidos, listarPedidosPorCliente, listarPedidosPorLoja, criarPedido } from '@/lib/data/pedidos'
import { isStaff } from '@/lib/auth-staff'
import { gerarClienteId } from '@/lib/cliente'
import { getClienteIdSessao, definirSessaoCliente } from '@/lib/sessao-cliente'
import { verificarLimite, ipDaRequisicao } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  // Staff credential wins: an authenticated operator always gets the panel view
  // (all orders / by store), even if the same browser also holds a client session.
  if (await isStaff()) {
    const lojaId = new URL(req.url).searchParams.get('lojaId')
    const pedidos = lojaId ? await listarPedidosPorLoja(lojaId) : await listarPedidos()
    return NextResponse.json({ pedidos })
  }

  // A client reads their OWN orders — scoped by the SIGNED session cookie, never
  // a query param. This closes the IDOR: you can't read someone else's orders by
  // guessing/deriving their clienteId anymore.
  const clienteId = await getClienteIdSessao()
  if (clienteId) {
    const pedidos = await listarPedidosPorCliente(clienteId)
    return NextResponse.json({ pedidos })
  }

  return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
}

export async function POST(req: NextRequest) {
  const limite = verificarLimite(`pedido:${ipDaRequisicao(req)}`, { max: 20, janelaMs: 60_000 })
  if (!limite.ok) {
    return NextResponse.json({ erro: 'Muitos pedidos seguidos. Aguarde um momento.' }, { status: 429 })
  }

  const data = await req.json()

  if (!String(data.clienteNome ?? '').trim() || !String(data.clienteTelefone ?? '').trim() || !String(data.descricao ?? '').trim()) {
    return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 })
  }

  // The clienteId is derived server-side (or taken from an existing session) —
  // the client cannot forge someone else's id in the body.
  const clienteId = (await getClienteIdSessao()) ?? gerarClienteId(String(data.clienteEmail ?? ''), String(data.clienteTelefone))
  await definirSessaoCliente(clienteId)

  const pedido = await criarPedido({
    clienteId,
    clienteNome: String(data.clienteNome).trim(),
    clienteTelefone: String(data.clienteTelefone).trim(),
    clienteEmail: data.clienteEmail || undefined,
    lojaId: data.lojaId || undefined,
    siteUrl: data.siteUrl || undefined,
    descricao: String(data.descricao).trim(),
    printUrl: data.printUrl || undefined,
    tipo: data.tipo === 'loja' ? 'loja' : 'geral',
  })
  return NextResponse.json({ pedido }, { status: 201 })
}
