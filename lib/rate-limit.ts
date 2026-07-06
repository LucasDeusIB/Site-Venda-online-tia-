import type { NextRequest } from 'next/server'

// Lightweight in-memory rate limiter (fixed window). Enough to stop brute-force
// on the panel login and spam on the public POST endpoints.
//
// Caveat: state lives in the process memory, so it is per-instance. On a single
// dev/prod instance it works well; on a multi-instance serverless deploy each
// instance keeps its own counter. For this app's scale that is an acceptable
// mitigation — swap for a shared store (Redis/Upstash) if you scale out.

type Janela = { contagem: number; reiniciaEm: number }
const buckets = new Map<string, Janela>()

export type ResultadoLimite = { ok: boolean; restante: number; reiniciaEm: number }

export function verificarLimite(
  chave: string,
  opcoes: { max: number; janelaMs: number }
): ResultadoLimite {
  const agora = Date.now()
  const atual = buckets.get(chave)

  if (!atual || agora >= atual.reiniciaEm) {
    const reiniciaEm = agora + opcoes.janelaMs
    buckets.set(chave, { contagem: 1, reiniciaEm })
    prune(agora)
    return { ok: true, restante: opcoes.max - 1, reiniciaEm }
  }

  atual.contagem++
  const ok = atual.contagem <= opcoes.max
  return { ok, restante: Math.max(0, opcoes.max - atual.contagem), reiniciaEm: atual.reiniciaEm }
}

// Occasionally drop expired buckets so the map does not grow unbounded.
function prune(agora: number): void {
  if (buckets.size < 500) return
  for (const [chave, janela] of buckets) {
    if (agora >= janela.reiniciaEm) buckets.delete(chave)
  }
}

// Best-effort client IP from proxy headers (Vercel/most hosts set these).
export function ipDaRequisicao(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'desconhecido'
}
