import { prisma } from './db'
import type { AutorMensagem, Pergunta } from './types'

// Uma pergunta some da aba depois de 48h SEM atividade — ou seja, 48h em que
// nem a cliente nem a staff escreveram nada. Qualquer mensagem nova reinicia a
// contagem. A conversa continua no banco; ela só sai da lista dos dois lados.
export const PERGUNTA_TTL_MS = 48 * 60 * 60 * 1000

export { TEXTO_MAX } from './types'

export function limiteDeAtividade(agora = new Date()): Date {
  return new Date(agora.getTime() - PERGUNTA_TTL_MS)
}

type LinhaPergunta = {
  id: string
  clienteId: string
  criadoEm: Date
  ultimaAtividadeEm: Date
  cliente: { nome: string; email: string; telefone: string }
  mensagens: { id: string; perguntaId: string; autor: string; texto: string; criadoEm: Date }[]
}

function paraPergunta(row: LinhaPergunta): Pergunta {
  return {
    id: row.id,
    clienteId: row.clienteId,
    clienteNome: row.cliente.nome,
    clienteEmail: row.cliente.email,
    clienteTelefone: row.cliente.telefone,
    criadoEm: row.criadoEm,
    ultimaAtividadeEm: row.ultimaAtividadeEm,
    mensagens: row.mensagens.map(m => ({
      id: m.id,
      perguntaId: m.perguntaId,
      autor: m.autor as AutorMensagem,
      texto: m.texto,
      criadoEm: m.criadoEm,
    })),
  }
}

const INCLUDE = {
  cliente: { select: { nome: true, email: true, telefone: true } },
  mensagens: { orderBy: { criadoEm: 'asc' } },
} as const

/** Perguntas ativas (com atividade nas últimas 48h) de uma cliente. */
export async function listarPerguntasDoCliente(clienteId: string): Promise<Pergunta[]> {
  const rows = await prisma.pergunta.findMany({
    where: { clienteId, ultimaAtividadeEm: { gte: limiteDeAtividade() } },
    orderBy: { ultimaAtividadeEm: 'desc' },
    include: INCLUDE,
  })
  return rows.map(paraPergunta)
}

/** Visão da staff: todas as conversas ativas, da mais recente para a mais antiga. */
export async function listarPerguntasAtivas(): Promise<Pergunta[]> {
  const rows = await prisma.pergunta.findMany({
    where: { ultimaAtividadeEm: { gte: limiteDeAtividade() } },
    orderBy: { ultimaAtividadeEm: 'desc' },
    include: INCLUDE,
  })
  return rows.map(paraPergunta)
}

export async function buscarPergunta(id: string): Promise<Pergunta | null> {
  const row = await prisma.pergunta.findUnique({ where: { id }, include: INCLUDE })
  return row ? paraPergunta(row) : null
}

/** Abre uma conversa nova já com a primeira mensagem da cliente. */
export async function criarPergunta(clienteId: string, texto: string): Promise<Pergunta> {
  const agora = new Date()
  const row = await prisma.pergunta.create({
    data: {
      clienteId,
      criadoEm: agora,
      ultimaAtividadeEm: agora,
      mensagens: { create: { autor: 'cliente', texto, criadoEm: agora } },
    },
    include: INCLUDE,
  })
  return paraPergunta(row)
}

/** Responde/continua uma conversa e reinicia o relógio das 48h. */
export async function responderPergunta(
  perguntaId: string,
  autor: AutorMensagem,
  texto: string,
): Promise<Pergunta | null> {
  const agora = new Date()
  await prisma.mensagemPergunta.create({
    data: { perguntaId, autor, texto, criadoEm: agora },
  })
  await prisma.pergunta.update({
    where: { id: perguntaId },
    data: { ultimaAtividadeEm: agora },
  })
  return buscarPergunta(perguntaId)
}

/** Conversas ativas em que a última palavra foi da cliente — o que a staff deve responder. */
export async function contarPerguntasSemResposta(): Promise<number> {
  const ativas = await listarPerguntasAtivas()
  return ativas.filter(p => p.mensagens.at(-1)?.autor === 'cliente').length
}
