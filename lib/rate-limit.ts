import { NextResponse } from 'next/server'

// Rate limiting simples em memória (janela fixa por IP+rota). Suficiente para um
// único processo. Em produção multi-instância (ex.: Vercel serverless), trocar
// por Redis/Upstash — este é o único ponto a alterar.

interface Janela {
  contagem: number
  expira: number
}

const baldes = new Map<string, Janela>()

function limpar(agora: number) {
  if (baldes.size < 5000) return
  for (const [k, v] of baldes) if (v.expira <= agora) baldes.delete(k)
}

export function ipDaRequisicao(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'desconhecido'
}

export function dentroDoLimite(chave: string, limite: number, janelaMs: number): boolean {
  const agora = Date.now()
  limpar(agora)
  const atual = baldes.get(chave)
  if (!atual || atual.expira <= agora) {
    baldes.set(chave, { contagem: 1, expira: agora + janelaMs })
    return true
  }
  atual.contagem += 1
  return atual.contagem <= limite
}

/** Aplica rate limit por IP a uma rota. Devolve 429 se estourou, ou null. */
export function checarRateLimit(
  request: Request,
  rota: string,
  limite: number,
  janelaMs: number,
): NextResponse | null {
  const chave = `${rota}:${ipDaRequisicao(request)}`
  if (dentroDoLimite(chave, limite, janelaMs)) return null
  return NextResponse.json(
    { erro: 'Muitas tentativas. Espere um pouco e tente de novo.' },
    { status: 429, headers: { 'Retry-After': String(Math.ceil(janelaMs / 1000)) } },
  )
}
