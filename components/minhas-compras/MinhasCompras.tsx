'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import type { ReservaCliente, Pedido, Produto, Loja } from '@/lib/data/types'
import { getClienteIdentidade } from '@/lib/cliente'
import { corBorda } from '@/lib/theme/acento'
import { StatusPedidoBadge } from '@/components/pedido/StatusPedidoBadge'
import { ProximaLevaBloco } from './ProximaLevaBloco'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function MinhasCompras() {
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [aba, setAba] = useState<'reservas' | 'pedidos'>('reservas')

  useEffect(() => {
    const id = getClienteIdentidade()
    if (id) setClienteId(id.clienteId)
  }, [])

  const { data: reservasData } = useSWR<{ reservas: ReservaCliente[] }>(
    clienteId ? `/api/reservas?clienteId=${clienteId}` : null,
    fetcher,
    { refreshInterval: 10000 }
  )

  const { data: pedidosData } = useSWR<{ pedidos: Pedido[] }>(
    clienteId ? `/api/pedidos?clienteId=${clienteId}` : null,
    fetcher,
    { refreshInterval: 10000 }
  )

  const { data: produtosData } = useSWR<{ produtos: Produto[] }>('/api/produtos', fetcher)
  const { data: lojasData } = useSWR<{ lojas: Loja[] }>('/api/lojas', fetcher)

  const reservas = reservasData?.reservas ?? []
  const pedidos = pedidosData?.pedidos ?? []
  const produtos = produtosData?.produtos ?? []
  const lojas = lojasData?.lojas ?? []

  if (!clienteId) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-xl font-medium text-[#0A0A0A] mb-2">Nenhuma compra ainda</p>
        <p className="text-sm font-archivo text-[#A3A3A3] leading-relaxed max-w-xs mx-auto">
          Quando você reservar um produto ou fizer um pedido, tudo aparece aqui.
        </p>
      </div>
    )
  }

  const reservasPendentes = reservas.filter(r => r.status === 'aguardando_pix')

  return (
    <div>
      {/* PRÓXIMA LEVA DE ENTREGA — bloco destacado no topo */}
      <ProximaLevaBloco />

      {/* ABA SWITCHER */}
      <div className="flex mb-8 border-b border-[#E63946]">
        {[
          { key: 'reservas', label: 'Compras', count: reservasPendentes.length },
          { key: 'pedidos', label: 'Pedidos', count: 0 },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setAba(key as 'reservas' | 'pedidos')}
            className={`relative flex items-center gap-2 pb-3 mr-6 text-xs font-archivo font-medium tracking-widest uppercase
              transition-colors ${aba === key ? 'text-[#0A0A0A] border-b-2 border-[#0A0A0A] -mb-px' : 'text-[#A3A3A3]'}`}
          >
            {label}
            {count > 0 && (
              <span className="w-4 h-4 bg-[#E63946] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {aba === 'reservas' ? (
        <ReservasLista reservas={reservas} produtos={produtos} />
      ) : (
        <PedidosLista pedidos={pedidos} lojas={lojas} />
      )}
    </div>
  )
}

function ReservasLista({ reservas, produtos }: { reservas: ReservaCliente[]; produtos: Produto[] }) {
  if (reservas.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-archivo text-[#A3A3A3]">Nenhuma compra ainda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reservas.map((reserva, i) => {
        const produto = produtos.find(p => p.id === reserva.produtoId)
        return (
          <ReservaItem key={reserva.id} reserva={reserva} produto={produto} index={i} />
        )
      })}
    </div>
  )
}

function ReservaItem({ reserva, produto, index }: { reserva: ReservaCliente; produto?: Produto; index: number }) {
  const STATUS_LABEL: Record<string, string> = {
    aguardando_pix: 'Aguardando PIX',
    pix_confirmado: 'Pago',
  }

  const isConfirmado = reserva.status === 'pix_confirmado'

  return (
    <div className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)} rounded-xl border ${corBorda(index)} p-4`}>
      <div className="flex gap-4">
        <div className="w-16 h-20 bg-[#F5F5F5] shrink-0 overflow-hidden rounded-xl">
          {produto?.fotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={produto.fotoUrl} alt={produto.nome} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-medium leading-tight mb-1">
            {produto?.nome ?? 'Produto'}
          </p>
          <p className="font-archivo font-medium text-sm mb-2">
            R$ {reserva.valorBRL.toLocaleString('pt-BR')}
          </p>

          <span className={`inline-block rounded-md text-[9px] font-archivo font-medium tracking-widest uppercase px-2 py-1
            ${isConfirmado ? 'bg-[#0A0A0A] text-[#FAFAFA]' : 'bg-[#E5E5E5] text-[#525252]'}`}>
            {STATUS_LABEL[reserva.status]}
          </span>
        </div>
      </div>
    </div>
  )
}

function PedidosLista({ pedidos, lojas }: { pedidos: Pedido[]; lojas: Loja[] }) {
  if (pedidos.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-archivo text-[#A3A3A3]">
          Nenhum pedido. <a href="/pedir" className="text-[#0A0A0A] underline underline-offset-2">Fazer um pedido?</a>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pedidos.map((pedido, i) => {
        const loja = lojas.find(l => l.id === pedido.lojaId)
        return (
          <div key={pedido.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)} rounded-xl border ${corBorda(i)} p-4`}>
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] break-all">
                  {loja?.nome ?? pedido.siteUrl ?? 'Pedido geral'}
                </p>
                <p className="text-sm font-archivo text-[#0A0A0A] mt-0.5 leading-tight line-clamp-2">
                  {pedido.descricao}
                </p>
              </div>
              <StatusPedidoBadge status={pedido.status} />
            </div>
            {pedido.respostaImportadora && (
              <div className="mt-2 bg-[#F5F5F5] rounded-lg px-3 py-2">
                <p className="text-xs font-archivo text-[#525252]">
                  <span className="font-medium text-[#0A0A0A]">Resposta: </span>
                  {pedido.respostaImportadora}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
