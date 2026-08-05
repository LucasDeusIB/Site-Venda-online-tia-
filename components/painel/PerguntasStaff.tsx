'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { TEXTO_MAX, type Pergunta } from '@/lib/data/types'

// Datas chegam como string no JSON.
function quando(valor: Date | string): string {
  return new Date(valor).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PerguntasStaff({
  perguntas,
  onUpdate,
}: {
  perguntas: Pergunta[]
  onUpdate: () => void
}) {
  // Quem escreveu por último manda na ordem: conversa esperando resposta sobe.
  const ordenadas = [...perguntas].sort((a, b) => {
    const esperaA = a.mensagens.at(-1)?.autor === 'cliente' ? 0 : 1
    const esperaB = b.mensagens.at(-1)?.autor === 'cliente' ? 0 : 1
    if (esperaA !== esperaB) return esperaA - esperaB
    return new Date(b.ultimaAtividadeEm).getTime() - new Date(a.ultimaAtividadeEm).getTime()
  })

  if (ordenadas.length === 0) {
    return (
      <div className="py-12 text-center pb-12">
        <p className="text-sm font-archivo text-[#525252]">Nenhuma pergunta aberta.</p>
        <p className="text-[11px] font-archivo text-[#A3A3A3] mt-2 leading-relaxed max-w-xs mx-auto">
          As conversas somem daqui depois de 48h sem ninguém escrever.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-12">
      {ordenadas.map(pergunta => (
        <ConversaStaff key={pergunta.id} pergunta={pergunta} onUpdate={onUpdate} />
      ))}
    </div>
  )
}

function ConversaStaff({ pergunta, onUpdate }: { pergunta: Pergunta; onUpdate: () => void }) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const aguardando = pergunta.mensagens.at(-1)?.autor === 'cliente'

  async function responder() {
    const limpo = texto.trim()
    if (!limpo || enviando) return
    setEnviando(true)
    setErro('')

    const res = await fetch(`/api/perguntas/${pergunta.id}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: limpo }),
    }).catch(() => null)

    setEnviando(false)
    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}))
      setErro(data?.erro ?? 'Não deu pra responder agora.')
      return
    }
    setTexto('')
    onUpdate()
  }

  return (
    <div
      className={`rounded-xl border p-4 ${aguardando ? 'border-[#E63946]' : 'border-[#E5E5E5]'}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-display text-sm font-medium leading-tight">{pergunta.clienteNome}</p>
          <p className="text-[10px] font-archivo text-[#A3A3A3] mt-0.5 break-all">
            {pergunta.clienteEmail} · {pergunta.clienteTelefone}
          </p>
        </div>
        {aguardando && (
          <span className="shrink-0 rounded-md bg-[#E63946] px-2 py-1 text-[9px] font-archivo font-medium tracking-widest uppercase text-white">
            Responder
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {pergunta.mensagens.map(m => {
          const daStaff = m.autor === 'staff'
          return (
            <div key={m.id} className={`flex ${daStaff ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%]">
                <p
                  className={`text-[9px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] mb-1
                    ${daStaff ? 'text-right' : ''}`}
                >
                  {daStaff ? 'Você' : pergunta.clienteNome} · {quando(m.criadoEm)}
                </p>
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-sm font-archivo leading-relaxed whitespace-pre-wrap break-words
                    ${daStaff ? 'bg-[#0A0A0A] text-[#FAFAFA]' : 'bg-[#F5F5F5] text-[#0A0A0A]'}`}
                >
                  {m.texto}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4">
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value.slice(0, TEXTO_MAX))}
          placeholder="Responder..."
          rows={2}
          className="w-full rounded-xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm font-archivo text-[#0A0A0A] resize-none
            focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#A3A3A3]"
        />

        {erro && <p className="text-[#E63946] text-xs font-archivo mt-1">{erro}</p>}

        <div className="flex items-center justify-between gap-3 mt-2">
          <span className="text-[10px] font-archivo text-[#A3A3A3]">
            Última atividade: {quando(pergunta.ultimaAtividadeEm)}
          </span>
          <button
            onClick={responder}
            disabled={enviando || !texto.trim()}
            className="flex items-center gap-2 bg-[#0A0A0A] text-[#FAFAFA] font-archivo text-[10px] font-medium tracking-widest uppercase px-4 py-2.5 rounded-xl
              transition-all hover:bg-[#262626] disabled:opacity-30"
          >
            <Send size={13} />
            {enviando ? 'Enviando...' : 'Responder'}
          </button>
        </div>
      </div>
    </div>
  )
}
