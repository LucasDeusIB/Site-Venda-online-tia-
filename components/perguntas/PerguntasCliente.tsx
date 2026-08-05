'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Send } from 'lucide-react'
import { TEXTO_MAX, type Pergunta } from '@/lib/data/types'
import { corBorda } from '@/lib/theme/acento'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// O servidor devolve só as conversas desta cliente — ele tira o id do cookie
// assinado, não de nada que a tela mande. Por isso a URL não leva clienteId.
const ROTA = '/api/perguntas'

// As mensagens voltam serializadas em JSON, então as datas chegam como string.
function quando(valor: Date | string): string {
  return new Date(valor).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PerguntasCliente() {
  const { data, mutate, isLoading } = useSWR<{ perguntas: Pergunta[] }>(ROTA, fetcher, {
    refreshInterval: 8000,
  })
  const perguntas = data?.perguntas ?? []
  const [abrindoNova, setAbrindoNova] = useState(false)

  async function criar(texto: string): Promise<string | null> {
    const res = await fetch(ROTA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    }).catch(() => null)

    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}))
      return data?.erro ?? 'Não deu pra enviar agora. Tente de novo.'
    }
    setAbrindoNova(false)
    mutate()
    return null
  }

  async function responder(perguntaId: string, texto: string): Promise<string | null> {
    const res = await fetch(`${ROTA}/${perguntaId}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    }).catch(() => null)

    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}))
      return data?.erro ?? 'Não deu pra enviar agora. Tente de novo.'
    }
    mutate()
    return null
  }

  if (isLoading && perguntas.length === 0) {
    return <p className="py-12 text-center text-sm font-archivo text-[#A3A3A3]">Carregando...</p>
  }

  // Sem conversa aberta, a caixa de escrever já é a tela inteira — não faz
  // sentido esconder atrás de um botão.
  if (perguntas.length === 0) {
    return (
      <div>
        <div className="py-8 text-center">
          <p className="font-display text-xl font-medium text-[#0A0A0A] mb-2">
            Nenhuma pergunta por aqui
          </p>
          <p className="text-sm font-archivo text-[#A3A3A3] leading-relaxed max-w-xs mx-auto">
            Escreva o que você quer saber. Só você e a equipe veem esta conversa.
          </p>
        </div>
        <CaixaDeTexto
          placeholder="Escreva sua pergunta..."
          botao="Enviar pergunta"
          onEnviar={criar}
        />
        <AvisoPrazo />
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-6">
        {perguntas.map((pergunta, i) => (
          <Conversa key={pergunta.id} pergunta={pergunta} index={i} onResponder={responder} />
        ))}
      </div>

      <div className="mt-8">
        {abrindoNova ? (
          <div className="animate-fade-in-up">
            <CaixaDeTexto
              placeholder="Escreva sua pergunta..."
              botao="Enviar pergunta"
              onEnviar={criar}
            />
            <button
              onClick={() => setAbrindoNova(false)}
              className="mt-2 text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] hover:text-[#0A0A0A] transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAbrindoNova(true)}
            className="w-full rounded-xl border border-dashed border-[#A3A3A3] py-3.5 text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252]
              hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors"
          >
            Fazer outra pergunta
          </button>
        )}
      </div>

      <AvisoPrazo />
    </div>
  )
}

function AvisoPrazo() {
  return (
    <p className="mt-6 text-[11px] font-archivo text-[#A3A3A3] leading-relaxed text-center">
      Uma conversa sai desta aba depois de 48h sem ninguém escrever nada.
    </p>
  )
}

function Conversa({
  pergunta,
  index,
  onResponder,
}: {
  pergunta: Pergunta
  index: number
  onResponder: (perguntaId: string, texto: string) => Promise<string | null>
}) {
  const aguardandoEquipe = pergunta.mensagens.at(-1)?.autor === 'cliente'

  return (
    <div className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)} rounded-xl border ${corBorda(index)} p-4`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3]">
          {quando(pergunta.criadoEm)}
        </p>
        {aguardandoEquipe && (
          <span className="rounded-md bg-[#E5E5E5] px-2 py-1 text-[9px] font-archivo font-medium tracking-widest uppercase text-[#525252]">
            Aguardando resposta
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {pergunta.mensagens.map(m => {
          const daCliente = m.autor === 'cliente'
          return (
            <div key={m.id} className={`flex ${daCliente ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%]">
                <p
                  className={`text-[9px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] mb-1
                    ${daCliente ? 'text-right' : ''}`}
                >
                  {daCliente ? 'Você' : 'Equipe'} · {quando(m.criadoEm)}
                </p>
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-sm font-archivo leading-relaxed whitespace-pre-wrap break-words
                    ${daCliente ? 'bg-[#0A0A0A] text-[#FAFAFA]' : 'bg-[#F5F5F5] text-[#0A0A0A]'}`}
                >
                  {m.texto}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4">
        <CaixaDeTexto
          placeholder="Escrever mais..."
          botao="Enviar"
          compacta
          onEnviar={texto => onResponder(pergunta.id, texto)}
        />
      </div>
    </div>
  )
}

/** Textarea + botão. Devolve a mensagem de erro do servidor, ou null se deu certo. */
function CaixaDeTexto({
  placeholder,
  botao,
  compacta,
  onEnviar,
}: {
  placeholder: string
  botao: string
  compacta?: boolean
  onEnviar: (texto: string) => Promise<string | null>
}) {
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    const limpo = texto.trim()
    if (!limpo || enviando) return
    setEnviando(true)
    setErro('')
    const falha = await onEnviar(limpo)
    setEnviando(false)
    if (falha) {
      setErro(falha)
      return
    }
    setTexto('')
  }

  return (
    <div>
      <textarea
        value={texto}
        onChange={e => setTexto(e.target.value.slice(0, TEXTO_MAX))}
        placeholder={placeholder}
        rows={compacta ? 2 : 4}
        className="w-full rounded-xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm font-archivo text-[#0A0A0A] resize-none
          focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#A3A3A3]"
      />

      {erro && <p className="text-[#E63946] text-xs font-archivo mt-1">{erro}</p>}

      <div className="flex items-center justify-between gap-3 mt-2">
        <span className="text-[10px] font-archivo text-[#A3A3A3]">
          {texto.length}/{TEXTO_MAX}
        </span>
        <button
          onClick={enviar}
          disabled={enviando || !texto.trim()}
          className="flex items-center gap-2 bg-[#0A0A0A] text-[#FAFAFA] font-archivo text-[10px] font-medium tracking-widest uppercase px-4 py-2.5 rounded-xl
            transition-all hover:bg-[#262626] disabled:opacity-30"
        >
          <Send size={13} />
          {enviando ? 'Enviando...' : botao}
        </button>
      </div>
    </div>
  )
}
