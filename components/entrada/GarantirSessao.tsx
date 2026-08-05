'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { carregarSessao, limparClienteIdentidade } from '@/lib/cliente'

// Guarda das telas do cliente. Pergunta ao servidor de quem é a sessão: se o
// cookie sumiu, expirou ou aponta para uma conta que não existe mais, limpa a
// cópia local e devolve a pessoa para a porta de entrada. Sem conta cadastrada,
// não há acesso às telas privadas.
export function GarantirSessao() {
  const router = useRouter()

  useEffect(() => {
    let cancelado = false
    carregarSessao().then(conta => {
      if (cancelado || conta) return
      limparClienteIdentidade()
      router.replace('/')
    })
    return () => {
      cancelado = true
    }
  }, [router])

  return null
}
