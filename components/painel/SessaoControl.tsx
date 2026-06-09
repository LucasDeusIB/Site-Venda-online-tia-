'use client'

import { useState } from 'react'
import { Zap, ZapOff, Copy, Check } from 'lucide-react'
import type { Loja, SessaoAoVivo } from '@/lib/data/types'

type Props = {
  sessao: SessaoAoVivo | null
  lojas: Loja[]
  onUpdate: () => void
}

export function SessaoControl({ sessao, lojas, onUpdate }: Props) {
  const [lojaId, setLojaId] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const lojaAtual = lojas.find(l => l.id === sessao?.lojaId)

  async function abrirSessao() {
    if (!lojaId) return
    setLoading(true)
    await fetch('/api/sessao-ao-vivo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lojaId }),
    })
    onUpdate()
    setLoading(false)
  }

  async function encerrarSessao() {
    if (!sessao) return
    setLoading(true)
    await fetch('/api/sessao-ao-vivo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessaoId: sessao.id }),
    })
    onUpdate()
    setLoading(false)
  }

  function gerarAvisoWhatsApp(): string {
    const loja = lojas.find(l => l.id === (sessao?.lojaId ?? lojaId))
    const nomeLoja = loja?.nome ?? 'loja'
    const url = typeof window !== 'undefined' ? `${window.location.origin}/ao-vivo` : ''
    return `🛍️ Estou ao vivo agora na ${nomeLoja}! Veja os produtos e compre antes que esgote:\n${url}`
  }

  function copiarAviso() {
    navigator.clipboard.writeText(gerarAvisoWhatsApp())
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  if (sessao?.ativa) {
    return (
      <div className="bg-[#E63946]/10 border border-[#E63946]/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse-live" />
            <p className="text-xs font-archivo font-medium tracking-widest uppercase text-[#FAFAFA]">
              Ao vivo — {lojaAtual?.nome ?? sessao.lojaId}
            </p>
          </div>
          <span className="text-[10px] font-archivo text-[#525252]">
            {sessao.viewersCount > 0 ? `${sessao.viewersCount} vendo` : 'aguardando'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copiarAviso}
            className="flex-1 flex items-center justify-center gap-2 border border-[#525252] text-[#FAFAFA] text-[10px]
              font-archivo font-medium tracking-widest uppercase py-2.5 transition-colors hover:border-[#FAFAFA]"
          >
            {copiado ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar aviso</>}
          </button>
          <button
            onClick={encerrarSessao}
            disabled={loading}
            className="flex items-center gap-2 border border-[#E63946]/50 text-[#E63946] text-[10px]
              font-archivo font-medium tracking-widest uppercase px-4 py-2.5 transition-colors hover:border-[#E63946] disabled:opacity-50"
          >
            <ZapOff size={12} />
            Encerrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-[#262626] p-4">
      <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] mb-3">
        Iniciar sessão ao vivo
      </p>
      <div className="flex gap-2">
        <select
          value={lojaId}
          onChange={e => setLojaId(e.target.value)}
          className="flex-1 bg-transparent border border-[#262626] text-[#FAFAFA] px-3 py-2.5 text-sm font-archivo
            focus:outline-none focus:border-[#525252] transition-colors appearance-none cursor-pointer"
        >
          <option value="" className="bg-[#0A0A0A]">Escolha a loja...</option>
          {lojas.map(l => (
            <option key={l.id} value={l.id} className="bg-[#0A0A0A]">{l.nome}</option>
          ))}
        </select>
        <button
          onClick={abrirSessao}
          disabled={!lojaId || loading}
          className="flex items-center gap-2 bg-[#FAFAFA] text-[#0A0A0A] text-[10px] font-archivo font-medium
            tracking-widest uppercase px-4 py-2.5 transition-all hover:bg-[#E5E5E5] disabled:opacity-30"
        >
          <Zap size={12} />
          {loading ? '...' : 'Ao Vivo'}
        </button>
      </div>
    </div>
  )
}
