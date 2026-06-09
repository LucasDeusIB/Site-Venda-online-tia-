import { NextRequest, NextResponse } from 'next/server'
import { buscarSessaoAtiva, abrirSessao, encerrarSessao } from '@/lib/data/sessoes'

export async function GET() {
  const sessao = await buscarSessaoAtiva()
  return NextResponse.json({ sessao })
}

export async function POST(req: NextRequest) {
  const { lojaId } = await req.json()
  if (!lojaId) return NextResponse.json({ erro: 'lojaId obrigatório' }, { status: 400 })
  const sessao = await abrirSessao(lojaId)
  return NextResponse.json({ sessao })
}

export async function DELETE(req: NextRequest) {
  const { sessaoId } = await req.json()
  if (!sessaoId) return NextResponse.json({ erro: 'sessaoId obrigatório' }, { status: 400 })
  const sessao = await encerrarSessao(sessaoId)
  return NextResponse.json({ sessao })
}
