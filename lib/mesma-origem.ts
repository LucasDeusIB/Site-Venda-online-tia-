import { NextResponse } from 'next/server'

// Trava de mesma-origem (anti-CSRF). Requisições que mudam estado só são aceitas
// se vierem da própria origem do site. O navegador sempre manda `Origin` em
// requisições cross-site que alteram estado (e em fetch same-origin), então
// comparar Origin com o Host da requisição fecha CSRF. Junto com cookies
// SameSite=Lax, é a proteção prática máxima para uma API de site público.
export function mesmaOrigem(request: Request): boolean {
  const host = request.headers.get('host')
  if (!host) return false

  const permitidos = (process.env.ORIGENS_PERMITIDAS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const origin = request.headers.get('origin')
  if (origin) {
    try {
      const oHost = new URL(origin).host
      return oHost === host || permitidos.includes(oHost)
    } catch {
      return false
    }
  }

  const referer = request.headers.get('referer')
  if (!referer) return false
  try {
    const rHost = new URL(referer).host
    return rHost === host || permitidos.includes(rHost)
  } catch {
    return false
  }
}

/** Devolve 403 se a requisição não for da mesma origem, ou null se estiver ok. */
export function checarOrigem(request: Request): NextResponse | null {
  if (mesmaOrigem(request)) return null
  return NextResponse.json({ erro: 'Origem não permitida' }, { status: 403 })
}
