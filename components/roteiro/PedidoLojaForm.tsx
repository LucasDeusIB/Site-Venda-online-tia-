'use client'

import { useState, useRef } from 'react'
import { Paperclip, X, Check } from 'lucide-react'
import type { Loja } from '@/lib/data/types'
import {
  getClienteIdentidade,
  setClienteIdentidade,
  gerarClienteId,
  getClienteEmail,
} from '@/lib/cliente'

// "Pedido da loja": tied to a store she is going to. Different from "Pedir"
// (a general request). Both carry photo + message and show up in her list.
export function PedidoLojaForm({ loja, onEnviado }: { loja: Loja; onEnviado?: () => void }) {
  const identidade = getClienteIdentidade()
  const [nome, setNome] = useState(identidade?.nome ?? '')
  const [telefone, setTelefone] = useState(identidade?.telefone ?? '')
  const [descricao, setDescricao] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function enviar() {
    if (!nome.trim() || !telefone.trim() || !descricao.trim()) {
      setErro('Preencha nome, WhatsApp e o que você quer.')
      return
    }
    setLoading(true)
    setErro('')

    const clienteEmail = getClienteEmail()
    const clienteId = gerarClienteId(clienteEmail, telefone)
    setClienteIdentidade({ clienteId, nome: nome.trim(), telefone: telefone.trim(), email: clienteEmail || undefined })

    let printUrl: string | undefined
    if (foto) {
      const form = new FormData()
      form.append('file', foto)
      form.append('prefix', 'print')
      const up = await fetch('/api/upload', { method: 'POST', body: form })
      printUrl = (await up.json()).url
    }

    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId,
        clienteNome: nome.trim(),
        clienteTelefone: telefone.trim(),
        clienteEmail: clienteEmail || undefined,
        lojaId: loja.id,
        descricao: descricao.trim(),
        printUrl,
        tipo: 'loja',
      }),
    })

    if (res.ok) {
      setEnviado(true)
      setDescricao('')
      setFoto(null)
      onEnviado?.()
      setTimeout(() => setEnviado(false), 3000)
    } else {
      setErro('Erro ao enviar. Tente de novo.')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3 pt-1">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Seu nome"
          className="border border-[#E5E5E5] bg-transparent px-3 py-2.5 text-sm font-archivo
            focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#A3A3A3]"
        />
        <input
          type="tel"
          value={telefone}
          onChange={e => setTelefone(e.target.value)}
          placeholder="WhatsApp"
          className="border border-[#E5E5E5] bg-transparent px-3 py-2.5 text-sm font-archivo
            focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#A3A3A3]"
        />
      </div>

      <textarea
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
        placeholder={`O que procurar na ${loja.nome}? Descreva o produto.`}
        rows={3}
        className="w-full border border-[#E5E5E5] bg-transparent px-3 py-2.5 text-sm font-archivo
          focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#A3A3A3] resize-none"
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => setFoto(e.target.files?.[0] ?? null)}
      />
      {foto ? (
        <div className="flex items-center gap-3 p-2.5 border border-[#E5E5E5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={URL.createObjectURL(foto)} alt="Print" className="w-10 h-10 object-cover" />
          <span className="flex-1 text-xs font-archivo text-[#525252] truncate">{foto.name}</span>
          <button onClick={() => setFoto(null)} className="text-[#A3A3A3] hover:text-[#0A0A0A]">
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 justify-center w-full text-xs font-archivo font-medium text-[#A3A3A3]
            hover:text-[#0A0A0A] transition-colors border border-dashed border-[#E5E5E5] px-4 py-2.5"
        >
          <Paperclip size={14} />
          Anexar print (opcional)
        </button>
      )}

      {erro && <p className="text-[#E63946] text-xs font-archivo">{erro}</p>}

      <button
        onClick={enviar}
        disabled={loading || enviado}
        className="w-full bg-[#0A0A0A] text-[#FAFAFA] font-archivo text-xs font-medium tracking-widest uppercase py-3
          transition-all hover:bg-[#262626] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {enviado ? (<><Check size={14} /> Enviado pra ela</>) : loading ? 'Enviando...' : 'Enviar meu pedido desta loja'}
      </button>
    </div>
  )
}
