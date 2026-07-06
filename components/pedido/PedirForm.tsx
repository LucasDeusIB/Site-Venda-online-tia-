'use client'

import { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { Paperclip, X, Check } from 'lucide-react'
import type { Pedido } from '@/lib/data/types'
import { getClienteIdentidade, setClienteIdentidade, gerarClienteId, getClienteEmail, garantirSessaoCliente } from '@/lib/cliente'
import { StatusPedidoBadge } from './StatusPedidoBadge'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function PedirForm() {
  const [nome, setNome] = useState(() => getClienteIdentidade()?.nome ?? '')
  const [telefone, setTelefone] = useState(() => getClienteIdentidade()?.telefone ?? '')
  const [site, setSite] = useState('')
  const [descricao, setDescricao] = useState('')
  const [print, setPrint] = useState<File | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sessaoId, setSessaoId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Orders are read from the signed session cookie, not a clienteId in the URL.
  useEffect(() => {
    garantirSessaoCliente().then(setSessaoId)
  }, [])

  const { data: pedidosData, mutate: mutatePedidos } = useSWR<{ pedidos: Pedido[] }>(
    sessaoId ? '/api/pedidos' : null,
    fetcher
  )
  const meusPedidos = pedidosData?.pedidos ?? []

  async function handleEnviar() {
    if (!nome.trim() || !telefone.trim() || !descricao.trim()) {
      setErro('Preencha seu nome, WhatsApp e o que você quer.')
      return
    }
    setLoading(true)
    setErro('')

    const clienteEmail = getClienteEmail()
    const cId = gerarClienteId(clienteEmail, telefone)
    setClienteIdentidade({ clienteId: cId, nome: nome.trim(), telefone: telefone.trim(), email: clienteEmail || undefined })

    let printUrl: string | undefined
    if (print) {
      const form = new FormData()
      form.append('file', print)
      form.append('prefix', 'print')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const uploaded = await res.json()
      printUrl = uploaded.url
    }

    // The POST derives the clienteId server-side and (re)issues the session cookie.
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteNome: nome.trim(),
        clienteTelefone: telefone.trim(),
        clienteEmail: clienteEmail || undefined,
        siteUrl: site.trim() || undefined,
        descricao: descricao.trim(),
        printUrl,
        tipo: 'geral',
      }),
    })

    if (res.ok) {
      setEnviado(true)
      setDescricao('')
      setSite('')
      setPrint(null)
      setSessaoId(cId)
      mutatePedidos()
      setTimeout(() => setEnviado(false), 3000)
    } else {
      setErro('Erro ao enviar. Tente novamente.')
    }
    setLoading(false)
  }

  return (
    <div>
      {/* FORM */}
      <div className="space-y-4 mb-10">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] block mb-1.5">
              Seu nome
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Nome"
              className="w-full border border-[#E5E5E5] bg-transparent px-3 py-2.5 text-sm font-archivo
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
              className="w-full border border-[#E5E5E5] bg-transparent px-3 py-2.5 text-sm font-archivo
                focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#A3A3A3]"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] block mb-1.5">
            Envie o site
          </label>
          <input
            type="text"
            value={site}
            onChange={e => setSite(e.target.value)}
            placeholder="Cole o link do produto ou a marca (qualquer loja)"
            className="w-full border border-[#E5E5E5] bg-transparent px-3 py-2.5 text-sm font-archivo
              focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#A3A3A3]"
          />
        </div>

        <div>
          <label className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] block mb-1.5">
            O que você quer?
          </label>
          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descreva o produto ou cole o link. Quanto mais detalhe, melhor."
            rows={4}
            className="w-full border border-[#E5E5E5] bg-transparent px-3 py-2.5 text-sm font-archivo
              focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#A3A3A3] resize-none"
          />
        </div>

        {/* PRINT UPLOAD */}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => setPrint(e.target.files?.[0] ?? null)}
          />
          {print ? (
            <div className="flex items-center gap-3 p-3 border border-[#E5E5E5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(print)}
                alt="Print"
                className="w-12 h-12 object-cover"
              />
              <span className="flex-1 text-xs font-archivo text-[#525252] truncate">{print.name}</span>
              <button onClick={() => setPrint(null)} className="text-[#A3A3A3] hover:text-[#0A0A0A] transition-colors">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-xs font-archivo font-medium text-[#A3A3A3] hover:text-[#0A0A0A]
                transition-colors border border-dashed border-[#E5E5E5] w-full px-4 py-3 justify-center"
            >
              <Paperclip size={14} />
              Anexar print do produto (opcional)
            </button>
          )}
        </div>

        {erro && <p className="text-[#E63946] text-xs font-archivo">{erro}</p>}

        <button
          onClick={handleEnviar}
          disabled={loading || enviado}
          className="w-full bg-[#0A0A0A] text-[#FAFAFA] font-archivo text-xs font-medium tracking-widest uppercase py-3.5
            transition-all duration-200 hover:bg-[#262626] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {enviado ? (
            <><Check size={14} /> Pedido enviado</>
          ) : loading ? 'Enviando...' : 'Enviar pedido'}
        </button>
      </div>

      {/* MEUS PEDIDOS */}
      {meusPedidos.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#E5E5E5]" />
            <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3]">
              Meus pedidos
            </p>
            <div className="flex-1 h-px bg-[#E5E5E5]" />
          </div>
          <div className="space-y-4">
            {meusPedidos.map((pedido, i) => (
              <div key={pedido.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                <PedidoItem pedido={pedido} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PedidoItem({ pedido }: { pedido: Pedido }) {
  const ehLink = !!pedido.siteUrl && /^https?:\/\//i.test(pedido.siteUrl)

  return (
    <div className="border border-[#E5E5E5] p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          {pedido.siteUrl ? (
            ehLink ? (
              <a href={pedido.siteUrl} target="_blank" rel="noopener noreferrer"
                className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] mb-0.5 block truncate underline underline-offset-2">
                {pedido.siteUrl}
              </a>
            ) : (
              <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] mb-0.5 truncate">
                {pedido.siteUrl}
              </p>
            )
          ) : (
            <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] mb-0.5">
              Pedido geral
            </p>
          )}
          <p className="text-sm font-archivo text-[#0A0A0A] line-clamp-2">{pedido.descricao}</p>
        </div>
        <StatusPedidoBadge status={pedido.status} />
      </div>
      {pedido.printUrl && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pedido.printUrl} alt="Print" className="w-16 h-16 object-cover" />
        </div>
      )}
      {pedido.respostaImportadora && (
        <div className="mt-2 bg-[#F5F5F5] px-3 py-2">
          <p className="text-xs font-archivo text-[#525252] leading-relaxed">
            <span className="font-medium text-[#0A0A0A]">Resposta: </span>
            {pedido.respostaImportadora}
          </p>
        </div>
      )}
    </div>
  )
}
