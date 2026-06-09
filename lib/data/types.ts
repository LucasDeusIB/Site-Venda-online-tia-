export type LojaStatus = 'ao_vivo' | 'em_breve' | 'mais_tarde' | 'amanha' | 'sempre'
export type PedidoStatus = 'pendente' | 'consigo' | 'vou_ver' | 'nao_consigo' | 'achei' | 'comprei' | 'nao_tinha'
export type ProdutoStatus = 'disponivel' | 'esgotado'
// Compra registrada via "Comprar" → PIX. Sem expiração: o pagamento (e seu prazo)
// fica a cargo do app de pagamento externo (PIX manual hoje, link no futuro).
export type ReservaStatus = 'aguardando_pix' | 'pix_confirmado'
export type PedidoTipo = 'geral' | 'loja' // 'geral' = Pedir; 'loja' = Pedido da loja onde ela está

export type Loja = {
  id: string
  nome: string
  siteUrl: string
  logoUrl?: string
  statusAtual: LojaStatus
  horarioEstimado?: string
  ordem: number
  criadoEm: Date
}

export type Produto = {
  id: string
  lojaId: string
  nome: string
  fotoUrl: string
  precoOriginalUSD: number
  precoVendaBRL: number
  temDesconto: boolean
  qtdDisponivel: number
  criadoEm: Date
  status: ProdutoStatus
}

export type Pedido = {
  id: string
  clienteId: string
  clienteNome: string
  clienteTelefone: string
  clienteEmail?: string
  lojaId?: string
  siteUrl?: string
  descricao: string
  printUrl?: string
  tipo: PedidoTipo
  status: PedidoStatus
  respostaImportadora?: string
  criadoEm: Date
  atualizadoEm: Date
}

export type SessaoAoVivo = {
  id: string
  lojaId: string
  inicioEm: Date
  fimEm?: Date
  ativa: boolean
  viewersCount: number
}

// Uma "compra": a cliente tocou em Comprar e recebeu a chave PIX. Estoque é
// ilimitado, então não há reserva por tempo nem trava de "quem clica primeiro".
export type ReservaCliente = {
  id: string
  produtoId: string
  clienteId: string
  clienteNome: string
  clienteTelefone: string
  clienteEmail?: string
  valorBRL: number
  criadoEm: Date
  status: ReservaStatus
}

export type ClienteIdentidade = {
  clienteId: string
  nome: string
  telefone: string
  email?: string
}

export type LevaStatus = 'a_caminho' | 'no_brasil' | 'saiu_entrega' | 'entregue'

export type LevaEntrega = {
  id: string
  dataPrevista: Date | null
  status: LevaStatus
  atualizadoEm: Date
}

// Abas do cliente que podem receber o pontinho de novidade.
export type AbaNotificacao = 'ao_vivo' | 'pedir' | 'minhas_compras'

// Estado por cliente: quais abas têm novidade não vista (só o pontinho, sem número).
export type NotificacoesCliente = {
  aoVivo: boolean
  pedir: boolean
  minhasCompras: boolean
}
