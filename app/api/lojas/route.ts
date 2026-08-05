import { NextRequest, NextResponse } from 'next/server'
import {
  listarLojas,
  atualizarStatusLoja,
  atualizarLoja,
  criarLoja,
  deletarLoja,
} from '@/lib/data/lojas'
import type { LojaStatus } from '@/lib/data/types'
import { isStaff } from '@/lib/auth-staff'
import { checarOrigem } from '@/lib/mesma-origem'
import { urlSegura } from '@/lib/url-segura'

export async function GET() {
  const lojas = await listarLojas()
  return NextResponse.json({ lojas })
}

export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  if (!(await isStaff())) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { nome, siteUrl, statusAtual, horarioEstimado } = await req.json().catch(() => ({}))
  const site = urlSegura(siteUrl)
  if (!nome?.trim() || !site) {
    return NextResponse.json({ erro: 'Nome e link (http/https) da loja são obrigatórios.' }, { status: 400 })
  }
  const loja = await criarLoja({
    nome: nome.trim(),
    siteUrl: site,
    statusAtual: (statusAtual as LojaStatus) ?? 'mais_tarde',
    horarioEstimado: horarioEstimado || undefined,
  })
  return NextResponse.json({ loja }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  if (!(await isStaff())) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { id, nome, siteUrl, statusAtual, horarioEstimado } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 })

  if (siteUrl !== undefined && !urlSegura(siteUrl)) {
    return NextResponse.json({ erro: 'Link inválido (use http/https)' }, { status: 400 })
  }

  // Editing fields vs. only toggling roteiro status — both supported.
  if (nome !== undefined || siteUrl !== undefined) {
    await atualizarLoja(id, {
      nome,
      siteUrl: siteUrl !== undefined ? urlSegura(siteUrl)! : undefined,
      statusAtual,
      horarioEstimado,
    })
  } else {
    await atualizarStatusLoja(id, statusAtual as LojaStatus, horarioEstimado)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  if (!(await isStaff())) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 })
  try {
    await deletarLoja(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 409 })
  }
}
