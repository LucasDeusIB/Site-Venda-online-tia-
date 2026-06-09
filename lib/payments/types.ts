export type MetodoPagamento = 'pix' | 'cartao'

export interface PaymentProvider {
  criarCobranca(input: {
    valorBRL: number
    parcelas?: number
    reservaId: string
    descricao: string
  }): Promise<{
    tipo: MetodoPagamento
    payload: Record<string, unknown>
    cobrancaId: string
  }>

  consultarStatus(cobrancaId: string): Promise<'pendente' | 'pago' | 'expirado' | 'falhou'>
}
