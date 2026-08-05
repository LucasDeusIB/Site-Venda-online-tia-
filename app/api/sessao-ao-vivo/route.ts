import { NextRequest, NextResponse } from 'next/server'
import { buscarSessaoAtiva, abrirSessao, encerrarSessao } from '@/lib/data/sessoes'
import { isStaff } from '@/lib/auth-staff'
import { checarOrigem } from '@/lib/mesma-origem'

export async function GET() {
  const sessao = await buscarSessaoAtiva()
  return NextResponse.json({ sessao })
}

export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  if (!(await isStaff())) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  const { lojaId } = await req.json().catch(() => ({}))
  if (!lojaId) return NextResponse.json({ erro: 'lojaId obrigatório' }, { status: 400 })
  const sessao = await abrirSessao(lojaId)
  return NextResponse.json({ sessao })
}

export async function DELETE(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  if (!(await isStaff())) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  const { sessaoId } = await req.json().catch(() => ({}))
  if (!sessaoId) return NextResponse.json({ erro: 'sessaoId obrigatório' }, { status: 400 })
  const sessao = await encerrarSessao(sessaoId)
  return NextResponse.json({ sessao })
}
