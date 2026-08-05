import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/data/db'
import { atualizarQtdProduto, deletarProduto } from '@/lib/data/produtos'
import { isStaff } from '@/lib/auth-staff'
import { checarOrigem } from '@/lib/mesma-origem'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  if (!(await isStaff())) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  const data = await req.json().catch(() => ({}))

  if (data.qtdDisponivel !== undefined) {
    const produto = await atualizarQtdProduto(id, data.qtdDisponivel)
    return NextResponse.json({ produto })
  }

  if (data.status !== undefined) {
    const produto = await prisma.produto.update({ where: { id }, data: { status: data.status } })
    return NextResponse.json({ produto })
  }

  return NextResponse.json({ erro: 'Nenhum campo válido' }, { status: 400 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  if (!(await isStaff())) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  await deletarProduto(id)
  return NextResponse.json({ ok: true })
}
