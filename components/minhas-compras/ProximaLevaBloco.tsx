'use client'

import useSWR from 'swr'
import { Plane } from 'lucide-react'
import type { LevaEntrega } from '@/lib/data/types'
import { LevaStatusBadge } from './LevaStatusBadge'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// "15 de agosto"
function formatarDataBR(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(data)
}

export function ProximaLevaBloco() {
  const { data } = useSWR<{ leva: LevaEntrega | null }>('/api/leva', fetcher, {
    refreshInterval: 10000,
  })

  const leva = data?.leva ?? null
  const temData = !!leva?.dataPrevista

  return (
    <div className="rounded-xl border border-[#E63946] p-4 mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Plane size={13} className="text-[#A3A3A3]" />
        <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3]">
          Próxima leva de entrega
        </p>
      </div>

      {temData ? (
        <div className="flex items-end justify-between gap-3">
          <p className="font-display text-2xl font-medium leading-none text-[#0A0A0A]">
            {formatarDataBR(new Date(leva!.dataPrevista!))}
          </p>
          {leva && <LevaStatusBadge status={leva.status} />}
        </div>
      ) : (
        <p className="text-sm font-archivo text-[#A3A3A3] leading-relaxed">
          Próxima data de entrega ainda não definida.
        </p>
      )}
    </div>
  )
}
