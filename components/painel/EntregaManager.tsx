'use client'

import { useState } from 'react'
import { Plane, Check } from 'lucide-react'
import type { LevaEntrega, LevaStatus } from '@/lib/data/types'

type Props = {
  leva: LevaEntrega | null
  onUpdate: () => void
}

const STATUS_OPCOES: { value: LevaStatus; label: string }[] = [
  { value: 'a_caminho', label: 'A caminho' },
  { value: 'no_brasil', label: 'No Brasil' },
  { value: 'saiu_entrega', label: 'Saiu para entrega' },
  { value: 'entregue', label: 'Entregue' },
]

// Date -> "yyyy-mm-dd" para o <input type="date">
function paraInputDate(data: Date | null | undefined): string {
  if (!data) return ''
  const d = new Date(data)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export function EntregaManager({ leva, onUpdate }: Props) {
  const [dataPrevista, setDataPrevista] = useState(paraInputDate(leva?.dataPrevista))
  const [status, setStatus] = useState<LevaStatus>(leva?.status ?? 'a_caminho')
  const [loading, setLoading] = useState(false)
  const [salvo, setSalvo] = useState(false)

  async function salvar() {
    setLoading(true)
    await fetch('/api/leva', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataPrevista: dataPrevista ? dataPrevista : null,
        status,
      }),
    })
    onUpdate()
    setLoading(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  return (
    <div className="rounded-xl border border-[#2D6CDF] p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Plane size={13} className="text-[#525252]" />
        <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252]">
          Próxima leva de entrega
        </p>
      </div>

      <div>
        <label className="block text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] mb-1.5">
          Data prevista
        </label>
        <input
          type="date"
          value={dataPrevista}
          onChange={e => setDataPrevista(e.target.value)}
          className="w-full bg-transparent rounded-xl border border-[#2D6CDF] text-[#0A0A0A] px-3 py-2.5 text-sm font-archivo
            focus:outline-none focus:border-[#0A0A0A] transition-colors"
        />
      </div>

      <div>
        <label className="block text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] mb-1.5">
          Status do envio
        </label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as LevaStatus)}
          className="w-full bg-transparent rounded-xl border border-[#2D6CDF] text-[#0A0A0A] px-3 py-2.5 text-sm font-archivo
            focus:outline-none focus:border-[#0A0A0A] transition-colors appearance-none cursor-pointer"
        >
          {STATUS_OPCOES.map(o => (
            <option key={o.value} value={o.value} className="bg-white">
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={salvar}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#0A0A0A] text-[#FAFAFA] text-[10px] font-archivo
          font-medium tracking-widest uppercase py-3 transition-all hover:bg-[#262626] disabled:opacity-30"
      >
        {salvo ? <><Check size={12} /> Salvo!</> : loading ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}
