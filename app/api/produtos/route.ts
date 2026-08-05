import { NextRequest, NextResponse } from 'next/server'
import { listarProdutosFeed, criarProduto } from '@/lib/data/produtos'
import { buscarSessaoAtiva } from '@/lib/data/sessoes'
import { isStaff } from '@/lib/auth-staff'
import { checarOrigem } from '@/lib/mesma-origem'

export async function GET() {
  const [produtos, sessao] = await Promise.all([
    listarProdutosFeed(),
    buscarSessaoAtiva(),
  ])

  return NextResponse.json({ produtos, sessao })
}

export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  if (!(await isStaff())) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  const data = await req.json().catch(() => ({}))
  const produto = await criarProduto(data)
  return NextResponse.json({ produto }, { status: 201 })
}
