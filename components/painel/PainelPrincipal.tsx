'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Loja, Produto, Pedido, ReservaCliente, LevaEntrega, Pergunta } from '@/lib/data/types'
import { SessaoControl } from './SessaoControl'
import { EntregaManager } from './EntregaManager'
import { PostagemRapida } from './PostagemRapida'
import { PedidosPorLoja } from './PedidosPorLoja'
import { ConfirmacaoPix } from './ConfirmacaoPix'
import { ProdutosAtivos } from './ProdutosAtivos'
import { LojasManager } from './LojasManager'
import { PerguntasStaff } from './PerguntasStaff'
import { PoweredBy } from '@/components/nav/PoweredBy'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type Aba = 'feed' | 'pedidos' | 'pix' | 'perguntas' | 'lojas' | 'entrega'

export function PainelPrincipal() {
  const [aba, setAba] = useState<Aba>('feed')
  const router = useRouter()

  const { data: sessaoData, mutate: mutateSessao } = useSWR('/api/sessao-ao-vivo', fetcher, { refreshInterval: 5000 })
  const { data: lojasData, mutate: mutateLojas } = useSWR<{ lojas: Loja[] }>('/api/lojas', fetcher)
  const { data: produtosData, mutate: mutateProdutos } = useSWR<{ produtos: Produto[] }>('/api/produtos', fetcher, { refreshInterval: 5000 })
  const { data: pedidosData, mutate: mutatePedidos } = useSWR<{ pedidos: Pedido[] }>('/api/pedidos', fetcher, { refreshInterval: 8000 })
  const { data: reservasData, mutate: mutateReservas } = useSWR<{ reservas: ReservaCliente[] }>('/api/reservas?pendentes=1', fetcher, { refreshInterval: 8000 })
  const { data: levaData, mutate: mutateLeva } = useSWR<{ leva: LevaEntrega | null }>('/api/leva', fetcher)
  // Com o cookie de staff, /api/perguntas devolve as conversas de todas as clientes.
  const { data: perguntasData, mutate: mutatePerguntas } = useSWR<{ perguntas: Pergunta[] }>('/api/perguntas', fetcher, { refreshInterval: 8000 })

  const sessao = sessaoData?.sessao ?? null
  const lojas = lojasData?.lojas ?? []
  const produtos = produtosData?.produtos ?? []
  const pedidos = pedidosData?.pedidos ?? []
  const reservasPendentes = reservasData?.reservas ?? []
  const leva = levaData?.leva ?? null
  const perguntas = perguntasData?.perguntas ?? []
  // Badge só conta o que está de fato parado esperando a staff.
  const perguntasSemResposta = perguntas.filter(p => p.mensagens.at(-1)?.autor === 'cliente').length

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/')
  }

  const abas: { key: Aba; label: string; badge?: number }[] = [
    { key: 'feed', label: 'Feed' },
    { key: 'pedidos', label: 'Pedidos', badge: pedidos.filter(p => p.status === 'pendente').length || undefined },
    { key: 'pix', label: 'PIX', badge: reservasPendentes.length || undefined },
    { key: 'perguntas', label: 'Perguntas', badge: perguntasSemResposta || undefined },
    { key: 'lojas', label: 'Lojas' },
    { key: 'entrega', label: 'Entrega' },
  ]

  return (
    <div className="max-w-[480px] mx-auto px-4">
      {/* HEADER */}
      <header className="flex items-center justify-between pt-8 pb-6">
        <div>
          <h1 className="font-display text-xl font-medium logo-gradient">Compras da Ca e Dani</h1>
          <p className="text-[10px] font-archivo tracking-widest uppercase text-[#525252] mt-0.5">
            Painel
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252]
            hover:text-[#0A0A0A] transition-colors"
        >
          <LogOut size={14} />
          Sair
        </button>
      </header>

      {/* SESSÃO CONTROL */}
      <SessaoControl
        sessao={sessao}
        lojas={lojas}
        onUpdate={mutateSessao}
      />

      {/* ABAS — pílulas arredondadas */}
      <div className="flex flex-wrap gap-2 mt-6 mb-6">
        {abas.map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-full border text-[10px] font-archivo font-medium tracking-widest uppercase
              transition-colors ${aba === key
                ? 'bg-[#0A0A0A] text-[#FAFAFA] border-[#0A0A0A]'
                : 'text-[#525252] border-[#2D6CDF] hover:border-[#0A0A0A] hover:text-[#0A0A0A]'}`}
          >
            {label}
            {badge && badge > 0 && (
              <span className="w-4 h-4 bg-[#E63946] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* CONTEÚDO */}
      {aba === 'feed' && (
        <div className="space-y-8 pb-12">
          {sessao?.ativa && (
            <PostagemRapida
              lojaId={sessao.lojaId}
              onPublicado={mutateProdutos}
            />
          )}
          <ProdutosAtivos
            produtos={produtos}
            onUpdate={mutateProdutos}
          />
        </div>
      )}

      {aba === 'pedidos' && (
        <PedidosPorLoja
          pedidos={pedidos}
          lojas={lojas}
          onUpdate={mutatePedidos}
        />
      )}

      {aba === 'pix' && (
        <ConfirmacaoPix
          reservas={reservasPendentes}
          produtos={produtos}
          onUpdate={mutateReservas}
        />
      )}

      {aba === 'perguntas' && (
        <PerguntasStaff perguntas={perguntas} onUpdate={mutatePerguntas} />
      )}

      {aba === 'lojas' && (
        <LojasManager lojas={lojas} onUpdate={mutateLojas} />
      )}

      {aba === 'entrega' && (
        <div className="pb-12">
          {/* key força reinicializar o form quando o leva carrega do servidor */}
          <EntregaManager
            key={leva ? String(leva.atualizadoEm) : 'vazio'}
            leva={leva}
            onUpdate={mutateLeva}
          />
        </div>
      )}

      <footer className="pt-4 pb-16 text-center">
        <PoweredBy dark />
      </footer>
    </div>
  )
}
