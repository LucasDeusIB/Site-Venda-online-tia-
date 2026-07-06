import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/data/db'
import { buscarSessaoAtiva, atualizarViewerCount } from '@/lib/data/sessoes'
import { getClienteIdSessao } from '@/lib/sessao-cliente'

const HEARTBEAT_WINDOW_MS = 10_000

export async function POST(req: NextRequest) {
  // Prefer the signed session; fall back to the body id for anonymous viewers
  // watching the live feed without having identified themselves. This is only a
  // presence heartbeat for the viewer count — it exposes no personal data.
  const body = await req.json().catch(() => ({}))
  const clienteId = (await getClienteIdSessao()) ?? body.clienteId
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
