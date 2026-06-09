'use client'

import { useState } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { Produto } from '@/lib/data/types'
import { corBorda } from '@/lib/theme/acento'

type Props = {
  produtos: Produto[]
  onUpdate: () => void
}

export function ProdutosAtivos({ produtos, onUpdate }: Props) {
  if (produtos.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-archivo text-[#525252]">Nenhum produto publicado ainda.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] mb-4">
        Produtos no feed ({produtos.length})
      </p>
      <div className="space-y-3">
        {produtos.map((produto, i) => (
          <ProdutoAdminCard key={produto.id} produto={produto} index={i} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  )
}

function ProdutoAdminCard({ produto, index, onUpdate }: { produto: Produto; index: number; onUpdate: () => void }) {
  const [qtd, setQtd] = useState(produto.qtdDisponivel)
  const [salvando, setSalvando] = useState(false)

  async function atualizarQtd(novaQtd: number) {
    setQtd(novaQtd)
    setSalvando(true)
    await fetch(`/api/produtos/${produto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qtdDisponivel: novaQtd }),
    })
    onUpdate()
    setSalvando(false)
  }

  async function deletar() {
    if (!confirm(`Remover "${produto.nome}" do feed?`)) return
    await fetch(`/api/produtos/${produto.id}`, { method: 'DELETE' })
    onUpdate()
  }

  return (
    <div className={`rounded-xl border ${corBorda(index)} p-3 flex gap-3`}>
      <div className="w-14 h-16 bg-[#F5F5F5] shrink-0 overflow-hidden rounded-xl">
        {produto.fotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={produto.fotoUrl} alt={produto.nome} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-archivo text-[#0A0A0A] truncate">{produto.nome}</p>
        <p className="text-xs font-archivo text-[#525252] mt-0.5">R$ {produto.precoVendaBRL.toLocaleString('pt-BR')}</p>

        <div className="flex items-center justify-between mt-2">
          {/* STEPPER */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => atualizarQtd(Math.max(0, qtd - 1))}
              disabled={salvando || qtd <= 0}
              className="w-7 h-7 rounded-xl border border-[#2D6CDF] flex items-center justify-center text-[#0A0A0A]
                hover:border-[#2D6CDF] transition-colors disabled:opacity-30"
            >
              <Minus size={10} />
            </button>
            <span className="font-archivo text-sm text-[#0A0A0A] w-5 text-center tabular-nums">{qtd}</span>
            <button
              onClick={() => atualizarQtd(qtd + 1)}
              disabled={salvando}
              className="w-7 h-7 rounded-xl border border-[#2D6CDF] flex items-center justify-center text-[#0A0A0A]
                hover:border-[#2D6CDF] transition-colors disabled:opacity-30"
            >
              <Plus size={10} />
            </button>
          </div>

          <button
            onClick={deletar}
            className="text-[#525252] hover:text-[#E63946] transition-colors p-1"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
