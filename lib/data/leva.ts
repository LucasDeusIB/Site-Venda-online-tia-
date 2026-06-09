import { prisma } from './db'
import type { LevaEntrega, LevaStatus } from './types'

// Registro único da próxima leva (sempre o mesmo id).
const LEVA_ID = 'singleton'

function mapLeva(raw: any): LevaEntrega {
  return {
    id: raw.id,
    dataPrevista: raw.dataPrevista ? new Date(raw.dataPrevista) : null,
    status: raw.status as LevaStatus,
    atualizadoEm: new Date(raw.atualizadoEm),
  }
}

export async function getLeva(): Promise<LevaEntrega | null> {
  const row = await prisma.levaEntrega.findUnique({ where: { id: LEVA_ID } })
  return row ? mapLeva(row) : null
}

export async function salvarLeva(data: {
  dataPrevista: Date | null
  status: LevaStatus
}): Promise<LevaEntrega> {
  const row = await prisma.levaEntrega.upsert({
    where: { id: LEVA_ID },
    create: { id: LEVA_ID, dataPrevista: data.dataPrevista, status: data.status },
    update: { dataPrevista: data.dataPrevista, status: data.status },
  })
  return mapLeva(row)
}
