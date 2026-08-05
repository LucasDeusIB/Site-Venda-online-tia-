'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/theme/brand'
import { PoweredBy } from '@/components/nav/PoweredBy'
import { cadastrar } from '@/lib/cliente'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const digitos = (s: string) => s.replace(/\D/g, '')

// Tempo que a mensagem de boas-vindas fica na tela antes de levar a cliente
// para o feed.
const ESPERA_BOAS_VINDAS = 3000

const CAMPO =
  `w-full rounded-xl border bg-transparent px-4 py-3.5 text-sm font-archivo text-[#FAFAFA]
   focus:outline-none transition-colors placeholder:text-[#525252]`

export function CadastroForm() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [confirmarEmail, setConfirmarEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [confirmarTelefone, setConfirmarTelefone] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [pronto, setPronto] = useState(false)

  // Confere enquanto digita, mas só reclama depois que a pessoa começou a
  // preencher o campo de confirmação.
  const emailDivergente =
    confirmarEmail.length > 0 && email.trim().toLowerCase() !== confirmarEmail.trim().toLowerCase()
  const telefoneDivergente =
    confirmarTelefone.length > 0 && digitos(telefone) !== digitos(confirmarTelefone)

  const podeEnviar =
    nome.trim().length > 0 &&
    EMAIL_RE.test(email.trim()) &&
    digitos(telefone).length >= 10 &&
    !emailDivergente &&
    !telefoneDivergente &&
    confirmarEmail.length > 0 &&
    confirmarTelefone.length > 0

  // Boas-vindas por 3s e a cliente cai direto no feed, já logada.
  useEffect(() => {
    if (!pronto) return
    const t = setTimeout(() => router.push('/ao-vivo'), ESPERA_BOAS_VINDAS)
    return () => clearTimeout(t)
  }, [pronto, router])

  async function enviar() {
    if (loading) return
    setErro('')

    if (!nome.trim()) return setErro('Digite seu nome.')
    if (!EMAIL_RE.test(email.trim())) return setErro('Digite um e-mail válido.')
    if (emailDivergente || !confirmarEmail) return setErro('Confirme seu e-mail — as escritas precisam ser iguais.')
    if (digitos(telefone).length < 10) return setErro('Digite um telefone válido com DDD.')
    if (telefoneDivergente || !confirmarTelefone) {
      return setErro('Confirme seu telefone — as escritas precisam ser iguais.')
    }

    setLoading(true)
    const resultado = await cadastrar({
      nome: nome.trim(),
      email: email.trim(),
      confirmarEmail: confirmarEmail.trim(),
      telefone: telefone.trim(),
      confirmarTelefone: confirmarTelefone.trim(),
    })
    setLoading(false)

    if (!resultado.ok) {
      setErro(resultado.erro)
      return
    }
    setPronto(true)
  }

  if (pronto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0A0A0A]">
        <div className="w-full max-w-sm text-center animate-fade-in-up">
          <h1 className="font-display text-3xl font-medium leading-tight logo-gradient">
            Seja bem-vindo e boas compras!
          </h1>
          <p className="text-[10px] font-archivo text-[#525252] tracking-[0.3em] uppercase mt-4">
            Sua conta está pronta · abrindo a loja
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[#0A0A0A]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-medium leading-tight logo-gradient">
            {BRAND.loja}
          </h1>
          <p className="text-[10px] font-archivo text-[#525252] tracking-[0.3em] uppercase mt-3">
            Criar conta
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="seu nome"
            autoComplete="name"
            className={`${CAMPO} border-[#262626] focus:border-[#525252]`}
          />

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu e-mail"
            autoComplete="email"
            className={`${CAMPO} border-[#262626] focus:border-[#525252]`}
          />
          <div>
            <input
              type="email"
              value={confirmarEmail}
              onChange={e => setConfirmarEmail(e.target.value)}
              placeholder="confirmar e-mail"
              autoComplete="off"
              className={`${CAMPO} ${emailDivergente ? 'border-[#E63946]' : 'border-[#262626] focus:border-[#525252]'}`}
            />
            {emailDivergente && (
              <p className="text-[#E63946] text-[11px] font-archivo mt-1.5">
                Os e-mails não condizem — escreva igual ao de cima.
              </p>
            )}
          </div>

          <input
            type="tel"
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
            placeholder="seu telefone com DDD"
            autoComplete="tel"
            className={`${CAMPO} border-[#262626] focus:border-[#525252]`}
          />
          <div>
            <input
              type="tel"
              value={confirmarTelefone}
              onChange={e => setConfirmarTelefone(e.target.value)}
              placeholder="confirmar telefone com DDD"
              autoComplete="off"
              className={`${CAMPO} ${telefoneDivergente ? 'border-[#E63946]' : 'border-[#262626] focus:border-[#525252]'}`}
            />
            {telefoneDivergente && (
              <p className="text-[#E63946] text-[11px] font-archivo mt-1.5">
                Os telefones não condizem — escreva igual ao de cima.
              </p>
            )}
          </div>

          <p className="text-[11px] font-archivo text-[#525252] leading-relaxed">
            Este e-mail e este telefone são a sua conta: é com eles que você entra e vê os seus
            pedidos e as suas compras.
          </p>

          {erro && <p className="text-[#E63946] text-xs font-archivo">{erro}</p>}

          <button
            onClick={enviar}
            disabled={loading || !podeEnviar}
            className="w-full bg-[#FAFAFA] text-[#0A0A0A] font-archivo text-xs font-medium tracking-widest uppercase py-3.5
              transition-all hover:bg-[#E5E5E5] disabled:opacity-40 mt-1"
          >
            {loading ? 'Criando conta...' : 'Criar minha conta'}
          </button>

          <p className="text-center text-xs font-archivo text-[#525252] pt-3">
            Já tem conta?{' '}
            <Link
              href="/"
              className="text-[#FAFAFA] underline underline-offset-4 decoration-[#525252] hover:decoration-[#FAFAFA] transition-colors"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-10">
        <PoweredBy dark />
      </div>
    </div>
  )
}
