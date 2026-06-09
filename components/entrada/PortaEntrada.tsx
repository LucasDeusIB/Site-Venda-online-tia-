'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/theme/brand'
import { PoweredBy } from '@/components/nav/PoweredBy'
import { gerarClienteId, setClienteIdentidade } from '@/lib/cliente'

// Not a secret — it only reveals the password field. The real gate is the password.
const STAFF_KEYWORD = 'Acesso Vendas Staff'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function PortaEntrada() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [modoStaff, setModoStaff] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function entrar() {
    setErro('')

    // Staff door: the exact keyword typed in the email field reveals the password.
    if (email.trim() === STAFF_KEYWORD) {
      setModoStaff(true)
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

    // Identity = email+phone pair. Same pair → same account; different pair → new account.
    const clienteId = gerarClienteId(email.trim(), telefone.trim())
    setClienteIdentidade({
      clienteId,
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim().toLowerCase(),
    })
    router.push('/ao-vivo')
  }

  async function acessarPainel() {
    if (!senha.trim()) return
    setLoading(true)
    setErro('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: senha }),
    })
    if (res.ok) {
      router.push('/painel')
    } else {
      setErro('Senha incorreta.')
    }
    setLoading(false)
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

        {!modoStaff ? (
          <div className="space-y-3">
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && entrar()}
              placeholder="seu nome"
              autoComplete="name"
              className="w-full border border-[#262626] bg-transparent px-4 py-3.5 text-sm font-archivo text-[#FAFAFA]
                focus:outline-none focus:border-[#525252] transition-colors placeholder:text-[#525252]"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && entrar()}
              placeholder="seu e-mail"
              autoComplete="email"
              className="w-full border border-[#262626] bg-transparent px-4 py-3.5 text-sm font-archivo text-[#FAFAFA]
                focus:outline-none focus:border-[#525252] transition-colors placeholder:text-[#525252]"
            />
            <input
              type="tel"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && entrar()}
              placeholder="seu telefone com DDD"
              autoComplete="tel"
              className="w-full border border-[#262626] bg-transparent px-4 py-3.5 text-sm font-archivo text-[#FAFAFA]
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
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#E63946]">
              Acesso da equipe
            </p>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && acessarPainel()}
              placeholder="senha"
              autoFocus
              className="w-full border border-[#262626] bg-transparent px-4 py-3.5 text-sm font-archivo text-[#FAFAFA]
                focus:outline-none focus:border-[#525252] transition-colors placeholder:text-[#525252]"
            />

            {erro && <p className="text-[#E63946] text-xs font-archivo">{erro}</p>}

            <button
              onClick={acessarPainel}
              disabled={loading}
              className="w-full bg-[#FAFAFA] text-[#0A0A0A] font-archivo text-xs font-medium tracking-widest uppercase py-3.5
                transition-all hover:bg-[#E5E5E5] disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Acessar painel'}
            </button>
            <button
              onClick={() => { setModoStaff(false); setErro(''); setSenha('') }}
              className="w-full text-[10px] font-archivo tracking-widest uppercase text-[#525252] hover:text-[#A3A3A3] transition-colors py-2"
            >
              Voltar
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-6">
        <PoweredBy dark />
      </div>
    </div>
  )
}
