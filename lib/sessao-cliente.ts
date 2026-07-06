import { cookies } from 'next/headers'

// Server-issued, signed session for a CLIENT (buyer). Fixes the IDOR where the
// client's `clienteId` used to arrive in the URL/body (fully client-controlled),
// letting anyone read another client's orders by passing a guessable id.
//
// The identity model stays the same on purpose (email+phone pair, no password —
// see PortaEntrada / docs/COMO_EDITAR.md §13): the SERVER derives the clienteId
// and signs it into an httpOnly cookie. To read someone's data you now need a
// valid signed session, which is only issued when you actually provide that
// person's email+phone — matching the documented trade-off, but closing the
// "pass any id in the URL" hole.
//
// HMAC-SHA256 via Web Crypto so it runs on both Edge and Node (same approach as
// the panel auth in app/api/auth/route.ts).

const COOKIE = 'cliente_sessao'
const SECRET = process.env.SESSION_SECRET ?? 'coreiq-dev-session-secret-troque-em-producao'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 dias

async function assinar(msg: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Length-safe comparison (avoids leaking match length via early return).
function comparaSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// Cookie value = `${clienteId}.${hmac(clienteId)}`.
async function verificarValor(valor: string): Promise<string | null> {
  const corte = valor.lastIndexOf('.')
  if (corte <= 0) return null
  const clienteId = valor.slice(0, corte)
  const assinatura = valor.slice(corte + 1)
  const esperado = await assinar(clienteId)
  return comparaSeguro(assinatura, esperado) ? clienteId : null
}

export async function definirSessaoCliente(clienteId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE, `${clienteId}.${await assinar(clienteId)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/',
  })
}

export async function limparSessaoCliente(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE)
}

// The trusted clienteId for the current request, or null if there is no valid
// signed session. This is the ONLY source data routes should use to scope a
// client's own data — never a query param or request body.
export async function getClienteIdSessao(): Promise<string | null> {
  const cookieStore = await cookies()
  const valor = cookieStore.get(COOKIE)?.value
  if (!valor) return null
  return verificarValor(valor)
}
