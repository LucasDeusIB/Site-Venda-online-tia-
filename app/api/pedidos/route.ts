import { NextRequest, NextResponse } from 'next/server'
import { listarPedidos, listarPedidosPorCliente, listarPedidosPorLoja, criarPedido } from '@/lib/data/pedidos'
import { isStaff } from '@/lib/auth-staff'
import { clienteAutenticado } from '@/lib/sessao-cliente'
import { checarOrigem } from '@/lib/mesma-origem'
import { checarRateLimit } from '@/lib/rate-limit'
import { urlSegura, imagemSegura } from '@/lib/url-segura'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lojaId = searchParams.get('lojaId')

  // Staff: todos os pedidos (ou de uma loja). Cliente: só os próprios — clienteId
  // do cookie assinado, nunca da query.
  if (await isStaff()) {
    const pedidos = lojaId ? await listarPedidosPorLoja(lojaId) : await listarPedidos()
    return NextResponse.json({ pedidos })
  }

  const clienteId = await clienteAutenticado()
  if (!clienteId) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  const pedidos = await listarPedidosPorCliente(clienteId)
  return NextResponse.json({ pedidos })
}

export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  const limite = checarRateLimit(req, 'pedidos', 20, 60_000)
  if (limite) return limite

  const clienteId = await clienteAutenticado()
  if (!clienteId) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const data = await req.json().catch(() => ({}))
  if (!data.clienteNome?.trim() || !data.clienteTelefone?.trim() || !data.descricao?.trim()) {
    return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 })
  }

  // clienteId vem SEMPRE do cookie; URLs do usuário são sanitizadas.
  const siteBruto = data.siteUrl?.trim() || undefined
  const siteUrl = siteBruto && /^https?:\/\//i.test(siteBruto) ? (urlSegura(siteBruto) ?? undefined) : siteBruto
  const pedido = await criarPedido({
    clienteId,
    clienteNome: data.clienteNome.trim(),
    clienteTelefone: data.clienteTelefone.trim(),
    clienteEmail: data.clienteEmail || undefined,
    lojaId: data.lojaId || undefined,
    siteUrl,
    descricao: data.descricao.trim(),
    printUrl: imagemSegura(data.printUrl) ?? undefined,
    tipo: data.tipo,
  })
  return NextResponse.json({ pedido }, { status: 201 })
}
