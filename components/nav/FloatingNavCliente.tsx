'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import type { AbaNotificacao, NotificacoesCliente } from '@/lib/data/types'
import { getClienteIdentidade } from '@/lib/cliente'
import { FloatingNav } from './FloatingNav'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Liga cada href de aba ao nome de aba das notificações.
const HREF_PARA_ABA: Record<string, AbaNotificacao> = {
  '/ao-vivo': 'ao_vivo',
  '/pedir': 'pedir',
  '/minhas-compras': 'minhas_compras',
}

/**
 * Wrapper client da nav flutuante: faz polling das novidades do cliente (SWR,
 * mesma cadência do resto do app) e marca a aba como vista ao abri-la — zerando
 * o pontinho. Cliente sem identidade ainda não recebe pontinho.
 */
export function FloatingNavCliente() {
  const pathname = usePathname()
  const [clienteId, setClienteId] = useState<string | null>(null)

  useEffect(() => {
    const id = getClienteIdentidade()
    if (id) setClienteId(id.clienteId)
  }, [])

  const { data, mutate } = useSWR<NotificacoesCliente>(
    clienteId ? `/api/notificacoes?clienteId=${clienteId}` : null,
    fetcher,
    { refreshInterval: 10000 }
  )

  // Ao abrir uma aba, marca como vista e revalida (some o pontinho).
  useEffect(() => {
    if (!clienteId) return
    const aba = HREF_PARA_ABA[pathname]
    if (!aba) return

    fetch('/api/notificacoes/visto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId, aba }),
    })
      .then(() => mutate())
      .catch(() => {})
  }, [pathname, clienteId, mutate])

  const dots: Record<string, boolean> = {
    '/ao-vivo': data?.aoVivo ?? false,
    '/pedir': data?.pedir ?? false,
    '/minhas-compras': data?.minhasCompras ?? false,
  }

  return <FloatingNav dots={dots} />
}
