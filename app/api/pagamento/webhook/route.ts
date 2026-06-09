import { NextRequest, NextResponse } from 'next/server'

// Webhook stub — inert in v1 (manual PIX confirmation).
// When a payment provider (Mercado Pago, Stripe, etc.) is integrated,
// implement automatic PIX confirmation here. No other routes need to change.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  console.log('[webhook] pagamento recebido (inerte no v1):', body)
  return NextResponse.json({ received: true })
}
