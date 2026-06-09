import { prisma } from './db'
import type { SessaoAoVivo } from './types'

function mapSessao(raw: any): SessaoAoVivo {
  return {
    ...raw,
    inicioEm: new Date(raw.inicioEm),
    fimEm: raw.fimEm ? new Date(raw.fimEm) : undefined,
  }
}

export async function buscarSessaoAtiva(): Promise<SessaoAoVivo | null> {
  const row = await prisma.sessaoAoVivo.findFirst({ where: { ativa: true } })
  return row ? mapSessao(row) : null
}

export async function abrirSessao(lojaId: string): Promise<SessaoAoVivo> {
  // Close any existing active session first
  await prisma.sessaoAoVivo.updateMany({
    where: { ativa: true },
    data: { ativa: false, fimEm: new Date() },
  })
  const row = await prisma.sessaoAoVivo.create({ data: { lojaId, ativa: true } })
  await prisma.loja.update({ where: { id: lojaId }, data: { statusAtual: 'ao_vivo' } })
  return mapSessao(row)
}

export async function encerrarSessao(id: string): Promise<SessaoAoVivo> {
  const sessao = await prisma.sessaoAoVivo.findUnique({ where: { id } })
  const row = await prisma.sessaoAoVivo.update({
    where: { id },
    data: { ativa: false, fimEm: new Date() },
  })
  if (sessao) {
    await prisma.loja.update({ where: { id: sessao.lojaId }, data: { statusAtual: 'mais_tarde' } })
  }
  return mapSessao(row)
}

export async function atualizarViewerCount(sessaoId: string, count: number) {
  return prisma.sessaoAoVivo.update({
    where: { id: sessaoId },
    data: { viewersCount: count },
  })
}
