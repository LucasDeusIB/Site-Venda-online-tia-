import type { ClienteIdentidade } from './data/types'

const STORAGE_KEY = 'coreiq_cliente'

// Estabelece a sessão no servidor: manda nome/e-mail/telefone, o servidor calcula
// o clienteId e devolve um cookie httpOnly assinado. É esse cookie — não o id no
// localStorage — que autoriza ler/gravar os dados do cliente nas rotas de API.
export async function estabelecerSessao(dados: {
  nome: string
  email: string
  telefone: string
}): Promise<{ clienteId: string; nome: string; email: string; telefone: string } | null> {
  try {
    const res = await fetch('/api/identidade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Stable client id derived from the email+phone PAIR — that pair is the account
// key (see PortaEntrada). Email is lowercased/trimmed, phone reduced to digits,
// so the same person always resolves to the same id and a different pair is a
// different account. Pure JS (FNV-1a) so this module is isomorphic and pulls NO
// Node `crypto` polyfill into the client bundle — it runs only in the browser and
// just needs to be deterministic, not cryptographic.
export function gerarClienteId(email: string, telefone: string): string {
  const seed = `${email.trim().toLowerCase()}:${telefone.replace(/\D/g, '')}`
  // Two FNV-1a passes with different offsets → wider space, low collision risk.
  const h1 = fnv1a(seed, 0x811c9dc5)
  const h2 = fnv1a(seed, 0x01000193)
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

function fnv1a(str: string, seed: number): number {
  let hash = seed >>> 0
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function getClienteIdentidade(): ClienteIdentidade | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setClienteIdentidade(id: ClienteIdentidade) {
  if (typeof window === 'undefined') return
  // Preserve any fields already stored (e.g. the email captured at the front door).
  const atual = getClienteIdentidade()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...atual, ...id }))
}

// Email is captured at the front door before name/phone exist, so we store it on
// its own and merge it into the full identity once the client buys or orders.
const EMAIL_KEY = 'coreiq_email'

export function setClienteEmail(email: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(EMAIL_KEY, email)
  const atual = getClienteIdentidade()
  if (atual) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...atual, email }))
}

export function getClienteEmail(): string {
  if (typeof window === 'undefined') return ''
  return getClienteIdentidade()?.email ?? localStorage.getItem(EMAIL_KEY) ?? ''
}
