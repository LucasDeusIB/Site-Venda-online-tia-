'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import type { ReservaCliente, Produto } from '@/lib/data/types'
import { corBorda } from '@/lib/theme/acento'

type Props = {
  reservas: ReservaCliente[]
  produtos: Produto[]
  onUpdate: () => void
}

export function ConfirmacaoPix({ reservas, produtos, onUpdate }: Props) {
  if (reservas.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-archivo text-[#525252]">Nenhum PIX aguardando confirmação.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-12">
      <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] mb-4">
        {reservas.length} aguardando confirmação
      </p>
      {reservas.map((reserva, i) => {
        const produto = produtos.find(p => p.id === reserva.produtoId)
        return (
          <ReservaPixItem key={reserva.id} reserva={reserva} produto={produto} index={i} onUpdate={onUpdate} />
        )
      })}
    </div>
  )
}

function ReservaPixItem({
  reserva,
  produto,
  index,
  onUpdate,
}: {
  reserva: ReservaCliente
  produto?: Produto
  index: number
  onUpdate: () => void
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  async function confirmar() {
    setConfirmando(true)
    await fetch(`/api/reservas/${reserva.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pix_confirmado' }),
    })
    setConfirmado(true)
    setTimeout(() => onUpdate(), 800)
    setConfirmando(false)
  }

  return (
    <div className={`rounded-xl border ${corBorda(index)} p-4 transition-all ${confirmado ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-archivo font-medium text-[#0A0A0A] text-sm">{reserva.clienteNome}</p>
          <p className="text-xs font-archivo text-[#525252] mt-0.5 truncate">
            {produto?.nome ?? `Produto ${reserva.produtoId.slice(0, 8)}`}
          </p>
          <p className="text-[10px] font-archivo text-[#525252] mt-0.5">{reserva.clienteTelefone}</p>
          <p className="font-display text-lg font-medium text-[#0A0A0A] mt-1">
            R$ {reserva.valorBRL.toLocaleString('pt-BR')}
          </p>
        </div>

        <button
          onClick={confirmar}
          disabled={confirmando || confirmado}
          className="shrink-0 flex items-center gap-2 bg-[#0A0A0A] text-[#FAFAFA] text-[10px] font-archivo
            font-medium tracking-widest uppercase px-4 py-2.5 transition-all hover:bg-[#262626]
            disabled:opacity-50"
        >
          <Check size={12} />
          {confirmado ? 'Confirmado' : 'Recebido'}
        </button>
      </div>
    </div>
  )
}
