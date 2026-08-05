'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/theme/brand'
import { PoweredBy } from '@/components/nav/PoweredBy'
import { entrar } from '@/lib/cliente'

// Porta do staff: escrever "painel staff" (ou só "staff") no campo do e-mail e a
// senha do painel no campo do telefone. A senha continua conferida no servidor
// (/api/auth), então o painel segue protegido por cookie httpOnly e rate-limit.
const STAFF_NOMES = ['painel staff', 'staff']

export function PortaEntrada() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function fazerLogin() {
    if (loading) return
    setErro('')

    if (STAFF_NOMES.includes(email.trim().toLowerCase())) {
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

    if (!email.trim() || !telefone.trim()) {
      setErro('Preencha e-mail e telefone.')
      return
    }

    // O servidor só devolve sessão se o par existir no cadastro.
    setLoading(true)
    const resultado = await entrar({ email: email.trim(), telefone: telefone.trim() })
    setLoading(false)
    if (!resultado.ok) {
      setErro(resultado.erro)
      return
    }
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
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fazerLogin()}
            placeholder="seu e-mail"
            autoComplete="email"
            className="w-full rounded-xl border border-[#262626] bg-transparent px-4 py-3.5 text-sm font-archivo text-[#FAFAFA]
              focus:outline-none focus:border-[#525252] transition-colors placeholder:text-[#525252]"
          />
          <input
            type="tel"
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fazerLogin()}
            placeholder="seu telefone com DDD"
            autoComplete="tel"
            className="w-full rounded-xl border border-[#262626] bg-transparent px-4 py-3.5 text-sm font-archivo text-[#FAFAFA]
              focus:outline-none focus:border-[#525252] transition-colors placeholder:text-[#525252]"
          />
          <p className="text-[11px] font-archivo text-[#525252] leading-relaxed">
            Entre com o mesmo e-mail e o mesmo telefone que você usou no cadastro.
          </p>

          {erro && <p className="text-[#E63946] text-xs font-archivo">{erro}</p>}

          <button
            onClick={fazerLogin}
            disabled={loading}
            className="w-full bg-[#FAFAFA] text-[#0A0A0A] font-archivo text-xs font-medium tracking-widest uppercase py-3.5
              transition-all hover:bg-[#E5E5E5] disabled:opacity-50 mt-1"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {/* Primeira vez aqui: a conta nasce no cadastro, não no login. */}
          <p className="text-center text-xs font-archivo text-[#525252] pt-3">
            Ainda não tem conta?{' '}
            <Link
              href="/cadastro"
              className="text-[#FAFAFA] underline underline-offset-4 decoration-[#525252] hover:decoration-[#FAFAFA] transition-colors"
            >
              Cadastrar-se
            </Link>
          </p>
        </div>
      </div>

      <div className="absolute bottom-6">
        <PoweredBy dark />
      </div>
    </div>
  )
}
