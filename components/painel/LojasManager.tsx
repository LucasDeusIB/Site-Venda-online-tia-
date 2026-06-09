'use client'

import { useState } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import type { Loja, LojaStatus } from '@/lib/data/types'

const STATUS_OPTIONS: { value: LojaStatus; label: string }[] = [
  { value: 'ao_vivo', label: 'Ao vivo agora' },
  { value: 'em_breve', label: 'Em breve' },
  { value: 'mais_tarde', label: 'Mais tarde' },
  { value: 'amanha', label: 'Amanhã' },
  { value: 'sempre', label: 'Sempre disponível' },
]

type Props = { lojas: Loja[]; onUpdate: () => void }

export function LojasManager({ lojas, onUpdate }: Props) {
  return (
    <div className="space-y-6 pb-12">
      <NovaLoja onUpdate={onUpdate} />
      <div>
        <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] mb-3">
          Minhas lojas ({lojas.length})
        </p>
        <div className="space-y-2">
          {lojas.map(loja => (
            <LojaRow key={loja.id} loja={loja} onUpdate={onUpdate} />
          ))}
        </div>
      </div>
    </div>
  )
}

function NovaLoja({ onUpdate }: { onUpdate: () => void }) {
  const [nome, setNome] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [statusAtual, setStatusAtual] = useState<LojaStatus>('mais_tarde')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function criar() {
    if (!nome.trim() || !siteUrl.trim()) {
      setErro('Preencha o nome e o link da loja.')
      return
    }
    setLoading(true)
    setErro('')
    const res = await fetch('/api/lojas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, siteUrl, statusAtual }),
    })
    if (res.ok) {
      setNome(''); setSiteUrl(''); setStatusAtual('mais_tarde')
      onUpdate()
    } else {
      setErro((await res.json()).erro ?? 'Erro ao criar loja.')
    }
    setLoading(false)
  }

  return (
    <div className="border border-[#262626] p-4 space-y-3">
      <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252]">Adicionar loja</p>
      <input
        value={nome}
        onChange={e => setNome(e.target.value)}
        placeholder="Nome (ex: Victoria's Secret)"
        className="w-full border border-[#262626] bg-transparent px-3 py-2.5 text-sm font-archivo text-[#FAFAFA]
          focus:outline-none focus:border-[#525252] placeholder:text-[#262626]"
      />
      <input
        value={siteUrl}
        onChange={e => setSiteUrl(e.target.value)}
        placeholder="Link do site (https://...)"
        className="w-full border border-[#262626] bg-transparent px-3 py-2.5 text-sm font-archivo text-[#FAFAFA]
          focus:outline-none focus:border-[#525252] placeholder:text-[#262626]"
      />
      <select
        value={statusAtual}
        onChange={e => setStatusAtual(e.target.value as LojaStatus)}
        className="w-full border border-[#262626] bg-[#0A0A0A] text-[#FAFAFA] px-3 py-2.5 text-sm font-archivo
          focus:outline-none focus:border-[#525252] appearance-none cursor-pointer"
      >
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {erro && <p className="text-[#E63946] text-xs font-archivo">{erro}</p>}
      <button
        onClick={criar}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#FAFAFA] text-[#0A0A0A] font-archivo text-xs
          font-medium tracking-widest uppercase py-3 transition-all hover:bg-[#E5E5E5] disabled:opacity-50"
      >
        <Plus size={14} /> {loading ? 'Criando...' : 'Criar loja'}
      </button>
    </div>
  )
}

function LojaRow({ loja, onUpdate }: { loja: Loja; onUpdate: () => void }) {
  const [horario, setHorario] = useState(loja.horarioEstimado ?? '')

  async function patch(data: Record<string, unknown>) {
    await fetch('/api/lojas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: loja.id, ...data }),
    })
    onUpdate()
  }

  async function deletar() {
    if (!confirm(`Excluir a loja "${loja.nome}"?`)) return
    const res = await fetch('/api/lojas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: loja.id }),
    })
    if (!res.ok) alert((await res.json()).erro ?? 'Não foi possível excluir.')
    onUpdate()
  }

  return (
    <div className="border border-[#262626] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-archivo text-sm font-medium text-[#FAFAFA] truncate">{loja.nome}</span>
          <a href={loja.siteUrl} target="_blank" rel="noopener noreferrer" className="text-[#525252] hover:text-[#FAFAFA] shrink-0">
            <ExternalLink size={12} />
          </a>
        </div>
        <button onClick={deletar} className="text-[#525252] hover:text-[#E63946] transition-colors p-1 shrink-0">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex gap-2">
        <select
          value={loja.statusAtual}
          onChange={e => patch({ statusAtual: e.target.value, horarioEstimado: horario || undefined })}
          className="flex-1 border border-[#262626] bg-[#0A0A0A] text-[#FAFAFA] px-2 py-2 text-xs font-archivo
            focus:outline-none focus:border-[#525252] appearance-none cursor-pointer"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {loja.statusAtual === 'em_breve' && (
          <input
            value={horario}
            onChange={e => setHorario(e.target.value)}
            onBlur={() => patch({ statusAtual: loja.statusAtual, horarioEstimado: horario || undefined })}
            placeholder="14h"
            className="w-16 border border-[#262626] bg-transparent text-[#FAFAFA] px-2 py-2 text-xs font-archivo
              focus:outline-none focus:border-[#525252] placeholder:text-[#262626]"
          />
        )}
      </div>
    </div>
  )
}
