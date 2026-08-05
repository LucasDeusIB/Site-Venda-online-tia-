import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/data/db'
import { buscarSessaoAtiva, atualizarViewerCount } from '@/lib/data/sessoes'
import { clienteAutenticado } from '@/lib/sessao-cliente'
import { checarOrigem } from '@/lib/mesma-origem'

const HEARTBEAT_WINDOW_MS = 10_000

export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  const clienteId = await clienteAutenticado()
  if (!clienteId) return NextResponse.json({ ok: false })

  // Upsert heartbeat — one row per clienteId, refreshed timestamp
  await prisma.viewerHeartbeat.upsert({
    where: { id: clienteId },
    update: { timestamp: new Date() },
    create: { id: clienteId, clienteId, timestamp: new Date() },
  })

  // Count unique viewers with heartbeat in the last 10s
  const cutoff = new Date(Date.now() - HEARTBEAT_WINDOW_MS)
  const count = await prisma.viewerHeartbeat.count({
    where: { timestamp: { gte: cutoff } },
  })

  const sessao = await buscarSessaoAtiva()
  if (sessao) {
    await atualizarViewerCount(sessao.id, count)
  }

  return NextResponse.json({ viewers: count })
}
