import { NextRequest, NextResponse } from 'next/server'
import {
  listarLojas,
  atualizarStatusLoja,
  atualizarLoja,
  criarLoja,
  deletarLoja,
} from '@/lib/data/lojas'
import type { LojaStatus } from '@/lib/data/types'

export async function GET() {
  const lojas = await listarLojas()
  return NextResponse.json({ lojas })
}

export async function POST(req: NextRequest) {
  const { nome, siteUrl, statusAtual, horarioEstimado } = await req.json()
  if (!nome?.trim() || !siteUrl?.trim()) {
    return NextResponse.json({ erro: 'Nome e link da loja são obrigatórios.' }, { status: 400 })
  }
  const loja = await criarLoja({
    nome: nome.trim(),
    siteUrl: siteUrl.trim(),
    statusAtual: (statusAtual as LojaStatus) ?? 'mais_tarde',
    horarioEstimado: horarioEstimado || undefined,
  })
  return NextResponse.json({ loja }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { id, nome, siteUrl, statusAtual, horarioEstimado } = await req.json()
  if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 })

  // Editing fields vs. only toggling roteiro status — both supported.
  if (nome !== undefined || siteUrl !== undefined) {
    await atualizarLoja(id, { nome, siteUrl, statusAtual, horarioEstimado })
  } else {
    await atualizarStatusLoja(id, statusAtual as LojaStatus, horarioEstimado)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 })
  try {
    await deletarLoja(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 409 })
  }
}
