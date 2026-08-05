import type { ClienteIdentidade, ContaCliente } from './data/types'

const STORAGE_KEY = 'coreiq_cliente'

// Lado do navegador da conta. A verdade mora no servidor (linha em Cliente +
// cookie httpOnly assinado); o localStorage é só uma cópia para as telas
// mostrarem nome/telefone sem esperar a rede. Nada aqui autoriza nada.

export type ResultadoConta =
  | { ok: true; conta: ContaCliente }
  | { ok: false; erro: string }

async function postConta(url: string, corpo: unknown): Promise<ResultadoConta> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, erro: data?.erro ?? 'Não deu pra continuar agora. Tente de novo.' }
    }
    const conta = data as ContaCliente
    guardarConta(conta)
    return { ok: true, conta }
  } catch {
    return { ok: false, erro: 'Sem conexão. Tente de novo.' }
  }
}

/** Cria a conta (e já entra). */
export function cadastrar(dados: {
  nome: string
  email: string
  confirmarEmail: string
  telefone: string
  confirmarTelefone: string
}): Promise<ResultadoConta> {
  return postConta('/api/cadastro', dados)
}

/** Entra numa conta que já existe. O par tem que bater com o do cadastro. */
export function entrar(dados: { email: string; telefone: string }): Promise<ResultadoConta> {
  return postConta('/api/identidade', dados)
}

/** Conta da sessão atual segundo o servidor, ou null se não está logada. */
export async function carregarSessao(): Promise<ContaCliente | null> {
  try {
    const res = await fetch('/api/identidade')
    if (!res.ok) return null
    const conta = (await res.json()) as ContaCliente
    guardarConta(conta)
    return conta
  } catch {
    return null
  }
}

export async function sair(): Promise<void> {
  limparClienteIdentidade()
  await fetch('/api/identidade', { method: 'DELETE' }).catch(() => {})
}

function guardarConta(conta: ContaCliente) {
  setClienteIdentidade({
    clienteId: conta.clienteId,
    nome: conta.nome,
    telefone: conta.telefone,
    email: conta.email,
  })
}

export function getClienteIdentidade(): ClienteIdentidade | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setClienteIdentidade(id: ClienteIdentidade) {
  if (typeof window === 'undefined') return
  const atual = getClienteIdentidade()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...atual, ...id }))
}

export function limparClienteIdentidade() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function getClienteEmail(): string {
  return getClienteIdentidade()?.email ?? ''
}
