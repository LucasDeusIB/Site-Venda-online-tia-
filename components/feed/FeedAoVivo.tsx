'use client'

import useSWR from 'swr'
import { useEffect, useRef } from 'react'
import { ProdutoCard } from '@/components/produto/ProdutoCard'
import type { Produto, SessaoAoVivo } from '@/lib/data/types'
import { getClienteIdentidade } from '@/lib/cliente'
import { BRAND } from '@/lib/theme/brand'
import { PoweredBy } from '@/components/nav/PoweredBy'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function FeedAoVivo() {
  const { data, isLoading } = useSWR<{ produtos: Produto[]; sessao: SessaoAoVivo | null }>(
    '/api/produtos',
    fetcher,
    {
      refreshInterval: (data) => (data?.sessao?.ativa ? 3000 : 0),
      revalidateOnFocus: false,
    }
  )

  const sessao = data?.sessao
  const produtos = data?.produtos ?? []
  const prevProdutosRef = useRef<Set<string>>(new Set())
  const novosIds = useRef<Set<string>>(new Set())

  // Heartbeat — registers this viewer every 3s when ao vivo
  useEffect(() => {
    if (!sessao?.ativa) return
    const cliente = getClienteIdentidade()
    if (!cliente) return

    const ping = () => {
      fetch('/api/viewers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: cliente.clienteId }),
      })
    }

    ping()
    const interval = setInterval(ping, 3000)
    return () => clearInterval(interval)
  }, [sessao?.ativa])

  // Track which products are new since last render
  useEffect(() => {
    const currentIds = new Set(produtos.map(p => p.id))
    novosIds.current = new Set(
      [...currentIds].filter(id => !prevProdutosRef.current.has(id))
    )
    // Don't mark all as new on first load
    if (prevProdutosRef.current.size === 0) {
      novosIds.current = new Set()
    }
    prevProdutosRef.current = currentIds
  }, [produtos])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border border-[#0A0A0A] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[480px] mx-auto px-5">
      {/* HEADER */}
      <header className="pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-xl font-medium tracking-tight leading-none max-w-[60%] logo-gradient">
            {BRAND.loja}
          </h1>
          {sessao?.ativa && (
            <div className="flex items-center gap-2 text-xs font-archivo font-medium tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse-live" />
              {sessao.viewersCount > 0 && (
                <span className="text-[#525252]">{sessao.viewersCount}</span>
              )}
              <span>Ao vivo</span>
            </div>
          )}
        </div>

        {sessao?.ativa ? (
          <LiveBanner lojaId={sessao.lojaId} />
        ) : (
          <p className="text-sm font-archivo text-[#A3A3A3] leading-relaxed">
            Ela não está ao vivo agora. Veja o{' '}
            <a href="/roteiro" className="text-[#0A0A0A] underline underline-offset-2">roteiro</a>{' '}
            ou faça um{' '}
            <a href="/pedir" className="text-[#0A0A0A] underline underline-offset-2">pedido</a>.
          </p>
        )}
      </header>

      {/* FEED */}
      {produtos.length === 0 ? (
        <EmptyFeed sessaoAtiva={sessao?.ativa ?? false} />
      ) : (
        <div className="space-y-12 pb-8">
          {produtos.map((produto, i) => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              index={i}
              isNew={novosIds.current.has(produto.id)}
            />
          ))}
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-12 text-center space-y-2">
        <p className="font-archivo text-[10px] font-medium tracking-[0.35em] uppercase text-[#A3A3A3]">
          {BRAND.loja}
        </p>
        <PoweredBy />
      </footer>
    </div>
  )
}

function LiveBanner({ lojaId }: { lojaId: string }) {
  const lojaNames: Record<string, string> = {
    sephora: 'Sephora',
    apple: 'Apple Store',
    nike: 'Nike',
    coach: 'Coach Outlet',
    amazon: 'Amazon',
  }
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-[#E5E5E5]" />
      <p className="text-xs font-archivo font-medium tracking-widest uppercase text-[#0A0A0A]">
        Agora em {lojaNames[lojaId] ?? lojaId}
      </p>
      <div className="flex-1 h-px bg-[#E5E5E5]" />
    </div>
  )
}

function EmptyFeed({ sessaoAtiva }: { sessaoAtiva: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">

      {/* VIDEO SLOT: substitua esta div por <video autoPlay muted loop playsInline> para adicionar vídeo decorativo */}
      <div className="w-16 h-16 bg-[#F5F5F5] rounded-full mb-6" />

      <p className="font-display text-xl font-medium text-[#0A0A0A] mb-2">
        {sessaoAtiva ? 'Produtos chegando...' : 'Nenhum produto ainda'}
      </p>
      <p className="text-sm font-archivo text-[#A3A3A3] max-w-xs leading-relaxed">
        {sessaoAtiva
          ? 'Fique aqui. Ela está postando agora.'
          : 'Quando ela entrar numa loja, os produtos aparecem aqui em tempo real.'
        }
      </p>
    </div>
  )
}
