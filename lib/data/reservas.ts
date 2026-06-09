import { prisma } from './db'
import type { ReservaCliente, ReservaStatus } from './types'

function mapReserva(raw: any): ReservaCliente {
  return {
    id: raw.id,
    produtoId: raw.produtoId,
    clienteId: raw.clienteId,
    clienteNome: raw.clienteNome,
    clienteTelefone: raw.clienteTelefone,
    clienteEmail: raw.clienteEmail ?? undefined,
    valorBRL: raw.valorBRL,
    criadoEm: new Date(raw.criadoEm),
    status: raw.status as ReservaStatus,
  }
}

// Registra uma compra (interesse de compra) ligada ao produto. Estoque é
// ilimitado: várias clientes podem querer o mesmo item, não há trava por tempo
// nem decremento de estoque. O pagamento é por fora (PIX hoje, link no futuro).
export async function criarReserva(data: {
  produtoId: string
  clienteId: string
  clienteNome: string
  clienteTelefone: string
  clienteEmail?: string
}): Promise<{ ok: true; reserva: ReservaCliente } | { ok: false; erro: string }> {
  const produto = await prisma.produto.findUnique({ where: { id: data.produtoId } })
  if (!produto) {
    return { ok: false, erro: 'Produto indisponível' }
  }

  const reserva = await prisma.reservaCliente.create({
    data: {
      produtoId: data.produtoId,
      clienteId: data.clienteId,
      clienteNome: data.clienteNome,
      clienteTelefone: data.clienteTelefone,
      clienteEmail: data.clienteEmail,
      valorBRL: produto.precoVendaBRL,
      status: 'aguardando_pix',
    },
  })

  return { ok: true, reserva: mapReserva(reserva) }
}

export async function listarReservasPorCliente(clienteId: string): Promise<ReservaCliente[]> {
  const rows = await prisma.reservaCliente.findMany({
    where: { clienteId },
    orderBy: { criadoEm: 'desc' },
  })
  return rows.map(mapReserva)
}

export async function listarReservasPendentes(): Promise<ReservaCliente[]> {
  const rows = await prisma.reservaCliente.findMany({
    where: { status: 'aguardando_pix' },
    orderBy: { criadoEm: 'desc' },
  })
  return rows.map(mapReserva)
}

export async function confirmarPix(reservaId: string): Promise<ReservaCliente> {
  const row = await prisma.reservaCliente.update({
    where: { id: reservaId },
    data: { status: 'pix_confirmado' },
  })
  return mapReserva(row)
}
