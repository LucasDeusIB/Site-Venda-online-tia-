import { NextRequest, NextResponse } from 'next/server'
import { getLeva, salvarLeva } from '@/lib/data/leva'
import type { LevaStatus } from '@/lib/data/types'

const STATUS_VALIDOS: LevaStatus[] = ['a_caminho', 'no_brasil', 'saiu_entrega', 'entregue']

export async function GET() {
  const leva = await getLeva()
  return NextResponse.json({ leva })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()

  const status = body.status as LevaStatus
  if (!STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ erro: 'status inválido' }, { status: 400 })
  }

  const dataPrevista = body.dataPrevista ? new Date(body.dataPrevista) : null
  if (dataPrevista && Number.isNaN(dataPrevista.getTime())) {
    return NextResponse.json({ erro: 'data inválida' }, { status: 400 })
  }

  const leva = await salvarLeva({ dataPrevista, status })
  return NextResponse.json({ leva })
}
