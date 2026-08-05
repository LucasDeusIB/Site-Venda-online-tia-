import { NextRequest, NextResponse } from 'next/server'

// Webhook de confirmação automática de pagamento. HOJE está inerte (o PIX é
// confirmado manualmente pela staff), mas já é blindado: NADA é processado sem
// uma assinatura HMAC válida. Quando integrar um provedor real (Efí, Pagar.me,
// Mercado Pago), configure PAYMENT_WEBHOOK_SECRET e ajuste o header/algoritmo
// de assinatura conforme a documentação dele.
export async function POST(req: NextRequest) {
  const segredo = process.env.PAYMENT_WEBHOOK_SECRET
  if (!segredo) {
    // Sem segredo configurado, o webhook não confia em ninguém.
    return NextResponse.json({ erro: 'Webhook não configurado' }, { status: 503 })
  }

  const assinaturaRecebida = req.headers.get('x-assinatura') ?? ''
  const corpo = await req.text()

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(segredo),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(corpo))
  const esperada = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  if (assinaturaRecebida.length !== esperada.length || assinaturaRecebida !== esperada) {
    return NextResponse.json({ erro: 'Assinatura inválida' }, { status: 401 })
  }

  // TODO: confirmar a reserva correspondente quando o provedor automático entrar.
  return NextResponse.json({ received: true })
}
