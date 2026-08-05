'use client'

import { useEffect } from 'react'
import { estabelecerSessao, getClienteIdentidade } from '@/lib/cliente'

// Cliente que já entrou antes chega direto nas telas com a identidade no
// localStorage, mas o cookie de sessão assinado pode ter expirado ou sumido.
// Este componente (montado no layout do cliente) o revalida silenciosamente.
export function GarantirSessao() {
  useEffect(() => {
    const id = getClienteIdentidade()
    if (id?.email && id.telefone && id.nome) {
      estabelecerSessao({ nome: id.nome, email: id.email, telefone: id.telefone })
    }
  }, [])
  return null
}
