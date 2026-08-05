import { NextRequest, NextResponse } from 'next/server'
import { confirmarPix } from '@/lib/data/reservas'
import { isStaff } from '@/lib/auth-staff'
import { checarOrigem } from '@/lib/mesma-origem'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  // Only staff confirms a PIX payment.
  if (!(await isStaff())) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  const { status } = await req.json()

  if (status !== 'pix_confirmado') {
    return NextResponse.json({ erro: 'Status inválido' }, { status: 400 })
  }

  const reserva = await confirmarPix(id)
  return NextResponse.json({ reserva })
}
