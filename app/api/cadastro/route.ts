import { NextRequest, NextResponse } from 'next/server'
import { criarConta, normalizarEmail, somenteDigitos } from '@/lib/data/clientes'
import { iniciarSessao } from '@/lib/sessao-cliente'
import { checarOrigem } from '@/lib/mesma-origem'
import { checarRateLimit } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// "Cadastrar-se": cria a conta e já entrega a sessão. A conferência de e-mail e
// telefone repetidos também é feita aqui — a do formulário é só conforto, quem
// decide é o servidor.
export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  const limite = checarRateLimit(req, 'cadastro', 5, 60_000)
  if (limite) return limite

  const body = await req.json().catch(() => ({}))
  const nome = (body.nome ?? '').trim()
  const email = (body.email ?? '').trim()
  const confirmarEmail = (body.confirmarEmail ?? '').trim()
  const telefone = (body.telefone ?? '').trim()
  const confirmarTelefone = (body.confirmarTelefone ?? '').trim()

  if (!nome) {
    return NextResponse.json({ erro: 'Digite seu nome.' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ erro: 'Digite um e-mail válido.' }, { status: 400 })
  }
  if (normalizarEmail(email) !== normalizarEmail(confirmarEmail)) {
    return NextResponse.json({ erro: 'Os e-mails não condizem.' }, { status: 400 })
  }
  if (somenteDigitos(telefone).length < 10) {
    return NextResponse.json({ erro: 'Digite um telefone válido com DDD.' }, { status: 400 })
  }
  if (somenteDigitos(telefone) !== somenteDigitos(confirmarTelefone)) {
    return NextResponse.json({ erro: 'Os telefones não condizem.' }, { status: 400 })
  }

  const resultado = await criarConta({ nome, email, telefone })
  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro }, { status: 409 })
  }

  await iniciarSessao(resultado.conta.clienteId)
  return NextResponse.json(resultado.conta, { status: 201 })
}
