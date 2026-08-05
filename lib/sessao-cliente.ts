import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

// Sessão do cliente no SERVIDOR. O par (e-mail + telefone) é a conta e o ID é
// determinístico — mas o ID sozinho NÃO pode ser credencial: quem soubesse o
// e-mail e o telefone de outra pessoa o reproduziria. Por isso o servidor emite
// um cookie assinado (HMAC com SESSION_SECRET); só quem passou pela porta de
// entrada com aquele par recebe um token válido para aquele ID.

export const CLIENTE_COOKIE = 'coreiq_sessao'

function segredo(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET não configurado')
  return s
}

// MESMA fórmula do browser (lib/cliente.ts): FNV-1a duplo. Reproduzida aqui para
// o servidor calcular o ID por conta própria e nunca confiar no que o cliente
// mandou — e para casar com os IDs já existentes no banco.
function fnv1a(str: string, seed: number): number {
  let hash = seed >>> 0
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function gerarClienteId(email: string, telefone: string): string {
  const seed = `${email.trim().toLowerCase()}:${telefone.replace(/\D/g, '')}`
  const h1 = fnv1a(seed, 0x811c9dc5)
  const h2 = fnv1a(seed, 0x01000193)
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

function assinar(clienteId: string): string {
  return createHmac('sha256', segredo()).update(clienteId).digest('hex')
}

export function tokenCliente(clienteId: string): string {
  return `${clienteId}.${assinar(clienteId)}`
}

function comparaSegura(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

/** Verifica o token e devolve o clienteId assinado, ou null se inválido. */
export function verificarToken(token: string | undefined | null): string | null {
  if (!token) return null
  const ponto = token.lastIndexOf('.')
  if (ponto <= 0) return null
  const clienteId = token.slice(0, ponto)
  const assinatura = token.slice(ponto + 1)
  if (!comparaSegura(assinatura, assinar(clienteId))) return null
  return clienteId
}

/** clienteId autenticado a partir do cookie assinado, ou null. */
export async function clienteAutenticado(): Promise<string | null> {
  const store = await cookies()
  return verificarToken(store.get(CLIENTE_COOKIE)?.value)
}

/** Entrega o cookie de sessão — só depois de cadastro ou login conferido. */
export async function iniciarSessao(clienteId: string): Promise<void> {
  const store = await cookies()
  store.set(CLIENTE_COOKIE, tokenCliente(clienteId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })
}

export async function encerrarSessao(): Promise<void> {
  const store = await cookies()
  store.delete(CLIENTE_COOKIE)
}
