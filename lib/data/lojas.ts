import { prisma } from './db'
import type { Loja, LojaStatus } from './types'

function mapLoja(raw: any): Loja {
  return {
    ...raw,
    statusAtual: raw.statusAtual as LojaStatus,
    criadoEm: new Date(raw.criadoEm),
    horarioEstimado: raw.horarioEstimado ?? undefined,
    logoUrl: raw.logoUrl ?? undefined,
  }
}

export async function listarLojas(): Promise<Loja[]> {
  const rows = await prisma.loja.findMany({ orderBy: { ordem: 'asc' } })
  return rows.map(mapLoja)
}

export async function buscarLoja(id: string): Promise<Loja | null> {
  const row = await prisma.loja.findUnique({ where: { id } })
  return row ? mapLoja(row) : null
}

export async function atualizarStatusLoja(id: string, statusAtual: LojaStatus, horarioEstimado?: string) {
  return prisma.loja.update({ where: { id }, data: { statusAtual, horarioEstimado } })
}

// Slugify a store name into a safe technical id (no accents/¡, lowercase, dashes).
function slugify(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || `loja-${Date.now()}`
}

export async function criarLoja(data: {
  nome: string
  siteUrl: string
  statusAtual: LojaStatus
  horarioEstimado?: string
}): Promise<Loja> {
  // Build a unique id from the name; append a counter if it already exists.
  const base = slugify(data.nome)
  let id = base
  let n = 1
  while (await prisma.loja.findUnique({ where: { id } })) {
    id = `${base}-${++n}`
  }
  const maxOrdem = await prisma.loja.aggregate({ _max: { ordem: true } })
  const row = await prisma.loja.create({
    data: { id, ...data, ordem: (maxOrdem._max.ordem ?? 0) + 1 },
  })
  return mapLoja(row)
}

export async function atualizarLoja(
  id: string,
  data: { nome?: string; siteUrl?: string; statusAtual?: LojaStatus; horarioEstimado?: string }
): Promise<Loja> {
  const row = await prisma.loja.update({ where: { id }, data })
  return mapLoja(row)
}

export async function deletarLoja(id: string) {
  // Products/orders reference a store — block deletion if any exist, so we never orphan data.
  const [produtos, pedidos] = await Promise.all([
    prisma.produto.count({ where: { lojaId: id } }),
    prisma.pedido.count({ where: { lojaId: id } }),
  ])
  if (produtos > 0 || pedidos > 0) {
    throw new Error('Essa loja tem produtos ou pedidos. Remova-os antes de excluir a loja.')
  }
  return prisma.loja.delete({ where: { id } })
}
