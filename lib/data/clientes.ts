import { prisma } from './db'
import { gerarClienteId } from '@/lib/sessao-cliente'
import type { ContaCliente } from './types'

// Contas das clientes. Regra da casa: a conta é o par (e-mail + telefone) e só
// existe depois do "Cadastrar-se". O login não cria nada — se não achar a linha,
// é "e-mail ou telefone incorreto".

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function somenteDigitos(telefone: string): string {
  return telefone.replace(/\D/g, '')
}

/**
 * Forma de comparar dois telefones. O número é o mesmo esteja ele escrito com o
 * código do país ou sem ele — quem cadastrou "+55 11 99999-9999" e depois entra
 * com "11 99999-9999" é a mesma pessoa, e não pode levar "telefone incorreto"
 * na cara. Fora isso a conferência é exata: DDD e número têm que bater.
 * (Celular = DDD + 9 dígitos = 11; fixo = DDD + 8 = 10. Com o 55 na frente,
 * viram 13 e 12.)
 */
export function chaveTelefone(telefone: string): string {
  const d = somenteDigitos(telefone)
  return (d.length === 12 || d.length === 13) && d.startsWith('55') ? d.slice(2) : d
}

function paraConta(row: {
  id: string
  nome: string
  email: string
  telefone: string
}): ContaCliente {
  return {
    clienteId: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
  }
}

export async function buscarConta(clienteId: string): Promise<ContaCliente | null> {
  const row = await prisma.cliente.findUnique({ where: { id: clienteId } })
  return row ? paraConta(row) : null
}

export async function contaPorEmail(email: string): Promise<ContaCliente | null> {
  const row = await prisma.cliente.findUnique({ where: { email: normalizarEmail(email) } })
  return row ? paraConta(row) : null
}

/**
 * Cria a conta. Um e-mail = uma conta: se o e-mail já foi cadastrado, manda a
 * pessoa entrar em vez de abrir uma segunda conta com os mesmos dados.
 */
export async function criarConta(dados: {
  nome: string
  email: string
  telefone: string
}): Promise<{ ok: true; conta: ContaCliente } | { ok: false; erro: string }> {
  const email = normalizarEmail(dados.email)
  const telefone = dados.telefone.trim()
  const telefoneDigitos = somenteDigitos(telefone)

  const jaExiste = await prisma.cliente.findUnique({ where: { email } })
  if (jaExiste) {
    return { ok: false, erro: 'Esse e-mail já tem conta. É só entrar com ele e o telefone.' }
  }

  const id = gerarClienteId(email, telefoneDigitos)

  // Corrida de dois cadastros iguais ao mesmo tempo: o unique do banco decide.
  try {
    const row = await prisma.cliente.create({
      data: { id, nome: dados.nome.trim(), email, telefone, telefoneDigitos },
    })
    return { ok: true, conta: paraConta(row) }
  } catch {
    return { ok: false, erro: 'Esse e-mail já tem conta. É só entrar com ele e o telefone.' }
  }
}

/**
 * Login: o par tem que bater com o que foi cadastrado. Procura pelo e-mail (que
 * é único) e só então confere o telefone — assim o id da conta vem da linha
 * gravada no cadastro, e não de um hash recalculado aqui, o que manteria os
 * pedidos antigos ligados mesmo se a fórmula do id mudasse um dia.
 * E-mail que não existe e telefone que não bate dão o mesmo `null`: quem errou
 * não descobre por qual dos dois campos errou.
 */
export async function autenticarConta(
  email: string,
  telefone: string,
): Promise<ContaCliente | null> {
  const emailNorm = normalizarEmail(email)

  const row = await prisma.cliente.findUnique({ where: { email: emailNorm } })
  if (!row) return null
  if (chaveTelefone(row.telefoneDigitos) !== chaveTelefone(telefone)) return null

  await prisma.cliente.update({ where: { id: row.id }, data: { ultimoAcessoEm: new Date() } })
  return paraConta(row)
}
