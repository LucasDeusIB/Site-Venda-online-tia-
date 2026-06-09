'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import type { Loja, LojaStatus } from '@/lib/data/types'
import { corBorda } from '@/lib/theme/acento'
import { PedidoLojaForm } from './PedidoLojaForm'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const STATUS_LABEL: Record<LojaStatus, string> = {
  ao_vivo: 'Ao vivo agora',
  em_breve: 'Em breve',
  mais_tarde: 'Mais tarde',
  amanha: 'Amanhã',
  sempre: 'Sempre disponível',
}

const STATUS_STYLE: Record<LojaStatus, string> = {
  ao_vivo: 'text-[#E63946]',
  em_breve: 'text-[#0A0A0A]',
  mais_tarde: 'text-[#A3A3A3]',
  amanha: 'text-[#A3A3A3]',
  sempre: 'text-[#525252]',
}

export function RoteiroCliente() {
  const { data, isLoading } = useSWR<{ lojas: Loja[] }>('/api/lojas', fetcher)
  const lojas = data?.lojas ?? []

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-20 bg-[#F5F5F5] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-px">
      {lojas.map((loja, i) => (
        <LojaItem key={loja.id} loja={loja} index={i} />
      ))}
    </div>
  )
}

function LojaItem({ loja, index }: { loja: Loja; index: number }) {
  const [aberta, setAberta] = useState(false)
  const isLive = loja.statusAtual === 'ao_vivo'

  return (
    <div className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)} rounded-xl overflow-hidden border ${corBorda(index)}`}>
      {/* HEADER — toca para abrir o link + pedido da loja */}
      <button
        onClick={() => setAberta(!aberta)}
        className="w-full flex items-center justify-between px-4 py-5 text-left transition-colors hover:bg-[#F5F5F5]"
      >
        <div>
          <p className="font-archivo text-sm font-medium text-[#0A0A0A]">{loja.nome}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-[#E63946] animate-pulse-live" />}
            <p className={`text-[10px] font-archivo font-medium tracking-widest uppercase ${STATUS_STYLE[loja.statusAtual]}`}>
              {STATUS_LABEL[loja.statusAtual]}
              {loja.statusAtual === 'em_breve' && loja.horarioEstimado && ` — ${loja.horarioEstimado}`}
            </p>
          </div>
        </div>
        {aberta ? <ChevronDown size={16} className="text-[#A3A3A3] shrink-0" /> : <ChevronRight size={16} className="text-[#A3A3A3] shrink-0" />}
      </button>

      {/* SETA ABERTA — link oficial + enviar pedido desta loja */}
      {aberta && (
        <div className="px-4 pb-5 pt-1 border-t border-[#2D6CDF] space-y-4">
          <a
            href={loja.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-[#2D6CDF] px-3 py-3 group hover:bg-[#F5F5F5] transition-colors"
          >
            <span className="text-xs font-archivo font-medium text-[#0A0A0A] group-hover:underline underline-offset-2">
              Abrir site da {loja.nome}
            </span>
            <ExternalLink size={14} className="text-[#A3A3A3] group-hover:text-[#0A0A0A] transition-colors" />
          </a>

          <div>
            <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] mb-2">
              Pedido desta loja
            </p>
            <PedidoLojaForm loja={loja} />
          </div>
        </div>
      )}
    </div>
  )
}
