import { cookies } from 'next/headers'

// Server-only check: is the current request authenticated as staff?
// Mirrors how the cookie is set in app/api/auth/route.ts (SHA-256 of the panel
// password via Web Crypto, so it stays Edge/Node compatible). Used to gate the
// staff-only API routes (listing everyone's orders, confirming PIX, etc.) — the
// proxy.ts middleware only guards the /painel pages, not these handlers.
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function isStaff(): Promise<boolean> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('painel_auth')?.value
  if (!cookie) return false
  const expected = await hashPassword(process.env.PANEL_PASSWORD ?? 'coreiq2024')
  return cookie === expected
}
