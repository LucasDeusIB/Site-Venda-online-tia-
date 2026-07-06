import type { ClienteIdentidade } from './data/types'

const STORAGE_KEY = 'coreiq_cliente'

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

// Ensures the server holds a signed session cookie for the stored identity. The
// data endpoints now scope by that cookie (not by a clienteId in the URL), so
// components call this on mount before reading. Idempotent and cheap; returns the
// server-confirmed clienteId, or null when there is no stored identity yet.
export async function garantirSessaoCliente(): Promise<string | null> {
  const id = getClienteIdentidade()
  if (!id?.telefone) return null
  try {
    const res = await fetch('/api/cliente/sessao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: id.nome, email: id.email ?? '', telefone: id.telefone }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.clienteId ?? id.clienteId ?? null
  } catch {
    return null
  }
}
