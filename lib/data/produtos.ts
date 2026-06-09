import { prisma } from './db'
import type { Produto, ProdutoStatus } from './types'

function mapProduto(raw: any): Produto {
  return {
    ...raw,
    status: raw.status as ProdutoStatus,
    criadoEm: new Date(raw.criadoEm),
  }
}

export async function listarProdutosFeed(): Promise<Produto[]> {
  const rows = await prisma.produto.findMany({
    orderBy: { criadoEm: 'desc' },
  })
  return rows.map(mapProduto)
}

export async function listarProdutosPorLoja(lojaId: string): Promise<Produto[]> {
  const rows = await prisma.produto.findMany({
    where: { lojaId },
    orderBy: { criadoEm: 'desc' },
  })
  return rows.map(mapProduto)
}

export async function buscarProduto(id: string): Promise<Produto | null> {
  const row = await prisma.produto.findUnique({ where: { id } })
  return row ? mapProduto(row) : null
}

export async function criarProduto(data: {
  lojaId: string
  nome: string
  fotoUrl: string
  precoOriginalUSD: number
  precoVendaBRL: number
  temDesconto: boolean
  qtdDisponivel: number
}): Promise<Produto> {
  const row = await prisma.produto.create({ data })
  return mapProduto(row)
}

export async function atualizarQtdProduto(id: string, qtdDisponivel: number) {
  return prisma.produto.update({ where: { id }, data: { qtdDisponivel } })
}

export async function marcarProdutoEsgotado(id: string) {
  return prisma.produto.update({ where: { id }, data: { status: 'esgotado' } })
}

export async function deletarProduto(id: string) {
  return prisma.produto.delete({ where: { id } })
}
