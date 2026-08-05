import { prisma } from './db'
import type { AbaNotificacao, NotificacoesCliente } from './types'

const EPOCH = new Date(0)

// Quando o cliente nunca abriu a aba, tudo desde sempre conta como novidade.
async function vistoEmPorAba(clienteId: string): Promise<Record<AbaNotificacao, Date>> {
  const rows = await prisma.visualizacaoAba.findMany({ where: { clienteId } })
  const base: Record<AbaNotificacao, Date> = {
    ao_vivo: EPOCH,
    pedir: EPOCH,
    minhas_compras: EPOCH,
    perguntas: EPOCH,
  }
  for (const r of rows) {
    if (r.aba in base) base[r.aba as AbaNotificacao] = new Date(r.vistoEm)
  }
  return base
}

/**
 * Calcula quais abas têm novidade não vista para um cliente (apenas o pontinho):
 * - aoVivo: produto novo no feed desde a última visita.
 * - pedir: a importadora respondeu ou mudou o status de um pedido deste cliente.
 * - minhasCompras: a data/status da próxima leva mudou desde a última visita.
 * - perguntas: a staff respondeu uma pergunta deste cliente desde a última visita.
 */
export async function getNotificacoes(clienteId: string): Promise<NotificacoesCliente> {
  const visto = await vistoEmPorAba(clienteId)

  const [ultimoProduto, ultimoPedido, leva, ultimaResposta] = await Promise.all([
    prisma.produto.findFirst({ orderBy: { criadoEm: 'desc' }, select: { criadoEm: true } }),
    // só pedidos em que a importadora agiu (status != pendente ou já respondeu)
    prisma.pedido.findFirst({
      where: {
        clienteId,
        OR: [{ status: { not: 'pendente' } }, { respostaImportadora: { not: null } }],
      },
      orderBy: { atualizadoEm: 'desc' },
      select: { atualizadoEm: true },
    }),
    prisma.levaEntrega.findUnique({
      where: { id: 'singleton' },
      select: { atualizadoEm: true },
    }),
    prisma.mensagemPergunta.findFirst({
      where: { autor: 'staff', pergunta: { clienteId } },
      orderBy: { criadoEm: 'desc' },
      select: { criadoEm: true },
    }),
  ])

  return {
    aoVivo: !!ultimoProduto && new Date(ultimoProduto.criadoEm) > visto.ao_vivo,
    pedir: !!ultimoPedido && new Date(ultimoPedido.atualizadoEm) > visto.pedir,
    minhasCompras: !!leva && new Date(leva.atualizadoEm) > visto.minhas_compras,
    perguntas: !!ultimaResposta && new Date(ultimaResposta.criadoEm) > visto.perguntas,
  }
}

// Marca a aba como vista agora — zera o pontinho daquela aba para o cliente.
export async function marcarVisto(clienteId: string, aba: AbaNotificacao): Promise<void> {
  await prisma.visualizacaoAba.upsert({
    where: { clienteId_aba: { clienteId, aba } },
    create: { clienteId, aba, vistoEm: new Date() },
    update: { vistoEm: new Date() },
  })
}
