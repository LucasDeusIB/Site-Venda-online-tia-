import { prisma } from './db'
import type { Pedido, PedidoStatus, PedidoTipo } from './types'

function mapPedido(raw: any): Pedido {
  return {
    ...raw,
    status: raw.status as PedidoStatus,
    tipo: (raw.tipo ?? 'geral') as PedidoTipo,
    criadoEm: new Date(raw.criadoEm),
    atualizadoEm: new Date(raw.atualizadoEm),
    printUrl: raw.printUrl ?? undefined,
    clienteEmail: raw.clienteEmail ?? undefined,
    lojaId: raw.lojaId ?? undefined,
    siteUrl: raw.siteUrl ?? undefined,
    respostaImportadora: raw.respostaImportadora ?? undefined,
  }
}

export async function listarPedidos(): Promise<Pedido[]> {
  const rows = await prisma.pedido.findMany({ orderBy: { criadoEm: 'desc' } })
  return rows.map(mapPedido)
}

export async function listarPedidosPorCliente(clienteId: string): Promise<Pedido[]> {
  const rows = await prisma.pedido.findMany({
    where: { clienteId },
    orderBy: { criadoEm: 'desc' },
  })
  return rows.map(mapPedido)
}

export async function listarPedidosPorLoja(lojaId: string): Promise<Pedido[]> {
  const rows = await prisma.pedido.findMany({
    where: { lojaId },
    orderBy: { criadoEm: 'desc' },
  })
  return rows.map(mapPedido)
}

export async function criarPedido(data: {
  clienteId: string
  clienteNome: string
  clienteTelefone: string
  clienteEmail?: string
  lojaId?: string
  siteUrl?: string
  descricao: string
  printUrl?: string
  tipo?: PedidoTipo
}): Promise<Pedido> {
  const row = await prisma.pedido.create({ data: { ...data, tipo: data.tipo ?? 'geral' } })
  return mapPedido(row)
}

export async function atualizarStatusPedido(
  id: string,
  status: PedidoStatus,
  respostaImportadora?: string
) {
  const row = await prisma.pedido.update({
    where: { id },
    data: { status, respostaImportadora },
  })
  return mapPedido(row)
}
