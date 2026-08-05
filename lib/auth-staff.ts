import { cookies } from 'next/headers'

export const PAINEL_COOKIE = 'painel_auth'

// Hash do cookie de staff, derivado da senha E do SESSION_SECRET do servidor.
// Assim, mesmo quem descobrir a senha não forja o cookie sem o segredo, e o valor
// não é uma função pública apenas da senha. Web Crypto → Edge/Node compatível.
export async function hashPainel(password: string): Promise<string> {
  const segredo = process.env.SESSION_SECRET ?? ''
  const encoder = new TextEncoder()
  const data = encoder.encode(`${segredo}:${password}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function comparaConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function senhaPainel(): string {
  return process.env.PANEL_PASSWORD ?? '12345'
}

export async function isStaff(): Promise<boolean> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(PAINEL_COOKIE)?.value
  if (!cookie) return false
  const expected = await hashPainel(senhaPainel())
  return comparaConstante(cookie, expected)
}
