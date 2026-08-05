'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/theme/brand'
import { PoweredBy } from '@/components/nav/PoweredBy'
import { estabelecerSessao, setClienteIdentidade } from '@/lib/cliente'

// Porta do staff: nome "painel staff" (ou só "staff") + o campo de telefone
// usado como senha do painel. A senha continua verificada no servidor
// (/api/auth), então o painel segue protegido por cookie httpOnly e rate-limit.
const STAFF_NOMES = ['painel staff', 'staff']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function PortaEntrada() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function entrar() {
    setErro('')

    // Porta do staff: nome "painel staff"/"staff" + telefone = senha → /painel.
    if (STAFF_NOMES.includes(nome.trim().toLowerCase())) {
      setLoading(true)
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: telefone.trim() }),
      }).catch(() => null)
      setLoading(false)
      if (res?.ok) {
        router.push('/painel')
        return
      }
      setErro('Acesso do painel negado.')
      return
    }

    if (!nome.trim()) {
      setErro('Digite seu nome para entrar.')
      return
    }
    if (!EMAIL_RE.test(email.trim())) {
      setErro('Digite um e-mail válido para entrar.')
      return
    }
    if (telefone.replace(/\D/g, '').length < 10) {
      setErro('Digite um telefone válido (com DDD).')
      return
    }

    // Identity = email+phone pair. O servidor calcula o id e assina o cookie de
    // sessão; sem esse cookie, as rotas de cliente não liberam os dados.
    setLoading(true)
    const sessao = await estabelecerSessao({
      nome: nome.trim(),
      email: email.trim(),
      telefone: telefone.trim(),
    })
    setLoading(false)
    if (!sessao) {
      setErro('Não deu pra entrar agora. Tente de novo.')
      return
    }
    setClienteIdentidade({
      clienteId: sessao.clienteId,
      nome: sessao.nome,
      telefone: sessao.telefone,
      email: sessao.email,
    })
    router.push('/ao-vivo')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0A0A0A]">
      {/* VIDEO SLOT: substitua esta div por <video autoPlay muted loop playsInline> para vídeo decorativo de fundo */}

      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl font-medium leading-tight logo-gradient">
            {BRAND.loja}
          </h1>
          <p className="text-[10px] font-archivo text-[#525252] tracking-[0.3em] uppercase mt-3">
            Importados ao vivo · EUA → Brasil
          </p>
        </div>

        <div className="space-y-3">
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && entrar()}
              placeholder="seu nome"
              autoComplete="name"
              className="w-full rounded-xl border border-[#262626] bg-transparent px-4 py-3.5 text-sm font-archivo text-[#FAFAFA]
                focus:outline-none focus:border-[#525252] transition-colors placeholder:text-[#525252]"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && entrar()}
              placeholder="seu e-mail"
              autoComplete="email"
              className="w-full rounded-xl border border-[#262626] bg-transparent px-4 py-3.5 text-sm font-archivo text-[#FAFAFA]
                focus:outline-none focus:border-[#525252] transition-colors placeholder:text-[#525252]"
            />
            <input
              type="tel"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && entrar()}
              placeholder="seu telefone com DDD"
              autoComplete="tel"
              className="w-full rounded-xl border border-[#262626] bg-transparent px-4 py-3.5 text-sm font-archivo text-[#FAFAFA]
                focus:outline-none focus:border-[#525252] transition-colors placeholder:text-[#525252]"
            />
            <p className="text-[11px] font-archivo text-[#525252] leading-relaxed">
              Seu e-mail e telefone juntos são sua conta. Use sempre os mesmos para ver seus pedidos.
            </p>

            {erro && <p className="text-[#E63946] text-xs font-archivo">{erro}</p>}

            <button
              onClick={entrar}
              className="w-full bg-[#FAFAFA] text-[#0A0A0A] font-archivo text-xs font-medium tracking-widest uppercase py-3.5
                transition-all hover:bg-[#E5E5E5] mt-1"
            >
              Entrar
            </button>
        </div>
      </div>

      <div className="absolute bottom-6">
        <PoweredBy dark />
      </div>
    </div>
  )
}
