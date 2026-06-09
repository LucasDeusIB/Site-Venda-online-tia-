import type { PaymentProvider } from './types'

// Manual PIX v1. Operator confirms receipt in the panel.
// When migrating to automatic PIX (e.g., Efí, Pagar.me), implement the webhook
// in app/api/pagamento/webhook/ and replace this class — nothing else changes.
export class PixProvider implements PaymentProvider {
  private chavePix: string
  private nomePix: string

  constructor() {
    this.chavePix = process.env.PIX_KEY ?? ''
    this.nomePix = process.env.PIX_NAME ?? 'CORE IQ'
  }

  async criarCobranca(input: {
    valorBRL: number
    reservaId: string
    descricao: string
  }) {
    return {
      tipo: 'pix' as const,
      payload: {
        chavePix: this.chavePix,
        nomePix: this.nomePix,
        valor: input.valorBRL,
        descricao: input.descricao,
        reservaId: input.reservaId,
      },
      cobrancaId: `pix-manual-${input.reservaId}`,
    }
  }

  // Manual v1 — status is set by the operator in the panel, not via polling
  async consultarStatus(_cobrancaId: string): Promise<'pendente' | 'pago' | 'expirado' | 'falhou'> {
    return 'pendente'
  }
}

export const pixProvider = new PixProvider()
