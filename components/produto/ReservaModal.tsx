'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Produto } from '@/lib/data/types'
import { getClienteIdentidade, getClienteEmail } from '@/lib/cliente'

type Etapa = 'identificar' | 'confirmar' | 'pix'

type PixPayload = {
  chavePix: string
  nomePix: string
  valor: number
  reservaId: string
}

export function ReservaModal({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const [etapa, setEtapa] = useState<Etapa>('identificar')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [pix, setPix] = useState<PixPayload | null>(null)

  useEffect(() => {
    const id = getClienteIdentidade()
    if (id) {
      setNome(id.nome)
      setTelefone(id.telefone)
      setEtapa('confirmar')
    }
  }, [])

  async function handleReservar() {
    if (!nome.trim() || !telefone.trim()) {
      setErro('Preencha seu nome e telefone.')
      return
    }
    setLoading(true)
    setErro('')

    // A compra entra na conta logada: quem manda é o cookie assinado da sessão,
    // não o que for digitado aqui.
    const clienteEmail = getClienteEmail()

    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId: produto.id, clienteNome: nome.trim(), clienteTelefone: telefone.trim(), clienteEmail: clienteEmail || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.erro ?? 'Erro ao reservar. Tente novamente.')
        setLoading(false)
        return
      }
      setPix(data.pix)
      setEtapa('pix')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[#FAFAFA] animate-fade-in-up">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E63946]">
          <h2 className="font-display text-lg font-medium">
            {etapa === 'pix' ? 'Pagamento PIX' : 'Comprar'}
          </h2>
          <button onClick={onClose} className="p-1 text-[#A3A3A3] hover:text-[#0A0A0A] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {etapa === 'pix' && pix ? (
            <PixEtapa pix={pix} produto={produto} onClose={onClose} />
          ) : (
            <>
              <div className="flex gap-4 mb-5 pb-5 border-b border-[#E63946]">
                <div className="w-16 h-20 bg-[#F5F5F5] shrink-0 overflow-hidden rounded-xl">
                  {produto.fotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={produto.fotoUrl} alt={produto.nome} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-display text-sm font-medium leading-tight">{produto.nome}</p>
                  {produto.temDesconto && produto.precoOriginalUSD > 0 && (
                    <p className="text-xs text-[#A3A3A3] mt-0.5 line-through">US$ {produto.precoOriginalUSD.toFixed(0)}</p>
                  )}
                  <p className="font-archivo font-medium text-sm mt-1">
                    <span className="text-[9px] tracking-widest uppercase text-[#A3A3A3] mr-1">somente</span>
                    R$ {produto.precoVendaBRL.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] block mb-1.5">
                    Seu nome
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Como você se chama"
                    className="w-full rounded-xl border border-[#E63946] bg-transparent px-3 py-2.5 text-sm font-archivo
                      focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#A3A3A3]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] block mb-1.5">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-xl border border-[#E63946] bg-transparent px-3 py-2.5 text-sm font-archivo
                      focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#A3A3A3]"
                  />
                </div>
              </div>

              {erro && (
                <p className="text-[#E63946] text-xs font-archivo mb-4">{erro}</p>
              )}

              <button
                onClick={etapa === 'identificar' ? () => setEtapa('confirmar') : handleReservar}
                disabled={loading}
                className="w-full bg-[#0A0A0A] text-[#FAFAFA] font-archivo text-xs font-medium tracking-widest uppercase py-3.5
                  transition-all duration-200 hover:bg-[#262626] disabled:opacity-50"
              >
                {loading ? 'Gerando PIX...' : etapa === 'identificar' ? 'Continuar' : 'Comprar com PIX'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PixEtapa({ pix, produto, onClose }: { pix: PixPayload; produto: Produto; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false)

  function copiarChave() {
    navigator.clipboard.writeText(pix.chavePix)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#F5F5F5] rounded-lg p-4 text-center">
        <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] mb-2">
          Valor a pagar
        </p>
        <p className="font-display text-2xl font-medium">
          R$ {produto.precoVendaBRL.toLocaleString('pt-BR')}
        </p>
      </div>

      <div>
        <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] mb-2">
          Chave PIX
        </p>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm font-archivo bg-[#F5F5F5] rounded-lg px-3 py-2.5 break-all">
            {pix.chavePix}
          </p>
          <button
            onClick={copiarChave}
            className="shrink-0 bg-[#0A0A0A] text-[#FAFAFA] text-xs font-archivo font-medium px-3 py-2.5 tracking-wider uppercase
              transition-all hover:bg-[#262626]"
          >
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <p className="text-xs text-[#A3A3A3] font-archivo mt-2">Destinatário: {pix.nomePix}</p>
      </div>

      <div className="text-xs font-archivo text-[#525252] leading-relaxed bg-[#F5F5F5] rounded-lg p-4">
        <p className="font-medium text-[#0A0A0A] mb-1">Próximo passo</p>
        <p>Faça o PIX para garantir o seu. Após o pagamento, a importadora confirma e você acompanha o status em <em>Minhas Compras</em>.</p>
      </div>

      <button
        onClick={onClose}
        className="w-full rounded-xl border border-[#E63946] text-[#0A0A0A] font-archivo text-xs font-medium tracking-widest uppercase py-3
          transition-all hover:bg-[#F5F5F5]"
      >
        Fechar e acompanhar
      </button>
    </div>
  )
}
