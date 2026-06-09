'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Check, ShoppingCart, RotateCcw } from 'lucide-react'
import type { Pedido, Loja } from '@/lib/data/types'
import type { PedidoStatus } from '@/lib/data/types'
import { ContatoCliente } from './ContatoCliente'
import { corBorda } from '@/lib/theme/acento'

// Status que contam como "resolvido" na lista de compra global.
const STATUS_RESOLVIDO: PedidoStatus[] = ['comprei', 'nao_tinha', 'nao_consigo']
const RESOLVIDO_LABEL: Partial<Record<PedidoStatus, string>> = {
  comprei: 'Comprado',
  nao_tinha: 'Não tinha',
  nao_consigo: 'Não rolou',
}

const STATUS_OPTIONS: { value: PedidoStatus; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'consigo', label: 'Consigo sim' },
  { value: 'vou_ver', label: 'Vou ver na loja' },
  { value: 'nao_consigo', label: 'Não consigo agora' },
  { value: 'achei', label: 'Achei!' },
  { value: 'comprei', label: 'Comprei' },
  { value: 'nao_tinha', label: 'Não tinha' },
]

const GERAIS_ID = '__gerais__'

function TipoBadge({ tipo }: { tipo: Pedido['tipo'] }) {
  const isLoja = tipo === 'loja'
  return (
    <span className={`rounded-md text-[8px] font-archivo font-medium tracking-widest uppercase px-1.5 py-0.5
      ${isLoja ? 'bg-[#E63946] text-[#FAFAFA]' : 'border border-[#2D6CDF] text-[#525252]'}`}>
      {isLoja ? 'Da loja' : 'Pedido'}
    </span>
  )
}

// Site/marca colado pelo cliente — vira link clicável quando é um endereço.
function SiteCliente({ site }: { site?: string }) {
  if (!site) return null
  const ehLink = /^https?:\/\//i.test(site)
  if (ehLink) {
    return (
      <a href={site} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 text-[10px] font-archivo text-[#2D6CDF] underline underline-offset-2 break-all mt-0.5">
        <ExternalLink size={10} className="shrink-0" /> {site}
      </a>
    )
  }
  return <p className="text-[10px] font-archivo text-[#A3A3A3] mt-0.5 break-all">Site/marca: {site}</p>
}

type Props = {
  pedidos: Pedido[]
  lojas: Loja[]
  onUpdate: () => void
}

export function PedidosPorLoja({ pedidos, lojas, onUpdate }: Props) {
  const [aberta, setAberta] = useState<string | null>(null)
  const [modoLista, setModoLista] = useState<string | null>(null)
  const [listaGlobal, setListaGlobal] = useState(false)

  // Modo "Fazer lista de compra": uma checklist única com TODOS os pedidos.
  if (listaGlobal) {
    return (
      <div className="pb-12">
        <button
          onClick={() => setListaGlobal(false)}
          className="flex items-center gap-2 text-[10px] font-archivo font-medium tracking-widest uppercase
            text-[#525252] hover:text-[#0A0A0A] transition-colors mb-4"
        >
          <ChevronRight size={14} className="rotate-180" /> Voltar aos pedidos
        </button>
        <ListaDeCompraGlobal pedidos={pedidos} lojas={lojas} onUpdate={onUpdate} />
      </div>
    )
  }

  // Grupos: cada loja com pedidos + um grupo "gerais" (pedidos sem loja, vindos do "Pedir").
  const grupos = lojas
    .map(l => ({ id: l.id, nome: l.nome, pedidos: pedidos.filter(p => p.lojaId === l.id) }))
    .filter(g => g.pedidos.length > 0)

  const gerais = pedidos.filter(p => !p.lojaId)
  if (gerais.length > 0) {
    grupos.push({ id: GERAIS_ID, nome: 'Pedidos gerais (pelo site)', pedidos: gerais })
  }

  if (grupos.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-archivo text-[#525252]">Nenhum pedido ainda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 pb-12">
      <button
        onClick={() => setListaGlobal(true)}
        className="w-full flex items-center justify-center gap-2 bg-[#0A0A0A] text-[#FAFAFA] text-[10px] font-archivo
          font-medium tracking-widest uppercase py-3 mb-2 transition-all hover:bg-[#262626]"
      >
        <ShoppingCart size={13} /> Fazer lista de compra
      </button>

      {grupos.map((grupo, gi) => {
        const pendentes = grupo.pedidos.filter(p => p.status === 'pendente').length
        const isAberta = aberta === grupo.id

        return (
          <div key={grupo.id} className={`rounded-xl overflow-hidden border ${corBorda(gi)}`}>
            <button
              onClick={() => setAberta(isAberta ? null : grupo.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#F5F5F5] transition-colors"
            >
              <div className="flex items-center gap-3">
                {isAberta ? <ChevronDown size={14} className="text-[#525252]" /> : <ChevronRight size={14} className="text-[#525252]" />}
                <span className="font-archivo text-sm font-medium text-[#0A0A0A]">{grupo.nome}</span>
                {pendentes > 0 && (
                  <span className="w-5 h-5 bg-[#E63946] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {pendentes}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-archivo text-[#525252]">{grupo.pedidos.length} pedido{grupo.pedidos.length !== 1 ? 's' : ''}</span>
            </button>

            {isAberta && (
              <div className={`border-t ${corBorda(gi)}`}>
                <div className="px-4 pt-3 pb-2">
                  <button
                    onClick={() => setModoLista(modoLista === grupo.id ? null : grupo.id)}
                    className="flex items-center gap-2 text-[10px] font-archivo font-medium tracking-widest uppercase
                      text-[#525252] hover:text-[#0A0A0A] transition-colors"
                  >
                    {modoLista === grupo.id ? 'Fechar lista de compras' : 'Ver lista de compras'}
                  </button>
                </div>

                {modoLista === grupo.id && (
                  <ListaDeCompras pedidos={grupo.pedidos} titulo={grupo.nome} />
                )}

                <div className="divide-y divide-[#2D6CDF]">
                  {grupo.pedidos.map(pedido => (
                    <PedidoAdminItem key={pedido.id} pedido={pedido} onUpdate={onUpdate} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Lista de compras: toca no produto para ver de quem é (e o contato).
function ListaDeCompras({ pedidos, titulo }: { pedidos: Pedido[]; titulo: string }) {
  const [abertoId, setAbertoId] = useState<string | null>(null)
  const relevantes = pedidos.filter(p =>
    ['pendente', 'consigo', 'vou_ver', 'achei'].includes(p.status)
  )

  return (
    <div className="mx-4 mb-3 rounded-xl border border-[#2D6CDF] bg-[#F5F5F5] rounded-lg p-3">
      <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#E63946] mb-3">
        Lista — {titulo}
      </p>
      {relevantes.length === 0 ? (
        <p className="text-xs font-archivo text-[#525252]">Sem pedidos relevantes.</p>
      ) : (
        <div className="space-y-2">
          {relevantes.map(p => (
            <div key={p.id}>
              <button
                onClick={() => setAbertoId(abertoId === p.id ? null : p.id)}
                className="w-full flex gap-3 items-start text-left"
              >
                {p.printUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.printUrl} alt="Print" className="w-10 h-10 object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <TipoBadge tipo={p.tipo} />
                    <p className="text-xs font-archivo text-[#0A0A0A] leading-tight">{p.descricao}</p>
                  </div>
                  <SiteCliente site={p.siteUrl} />
                  <p className="text-[10px] font-archivo text-[#525252] mt-0.5">{p.clienteNome} · toque para ver contato</p>
                </div>
              </button>
              {abertoId === p.id && (
                <div className="mt-2">
                  <ContatoCliente nome={p.clienteNome} telefone={p.clienteTelefone} email={p.clienteEmail} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Lista de compra GLOBAL: checklist única com todos os pedidos. Ela marca cada
// item como "Comprei" (ou "Não tinha") e ele vai para a seção de resolvidos.
function ListaDeCompraGlobal({ pedidos, lojas, onUpdate }: { pedidos: Pedido[]; lojas: Loja[]; onUpdate: () => void }) {
  const nomeLoja = (p: Pedido) =>
    lojas.find(l => l.id === p.lojaId)?.nome ?? p.siteUrl ?? 'Pedido geral'

  const aComprar = pedidos.filter(p => !STATUS_RESOLVIDO.includes(p.status))
  const resolvidos = pedidos.filter(p => STATUS_RESOLVIDO.includes(p.status))

  if (pedidos.length === 0) {
    return <p className="text-sm font-archivo text-[#525252] py-8 text-center">Nenhum pedido para listar.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#E63946] mb-3">
          A comprar ({aComprar.length})
        </p>
        {aComprar.length === 0 ? (
          <p className="text-xs font-archivo text-[#525252]">Tudo resolvido! 🎉</p>
        ) : (
          <div className="space-y-2">
            {aComprar.map((p, i) => (
              <ItemCompra key={p.id} pedido={p} loja={nomeLoja(p)} index={i} onUpdate={onUpdate} />
            ))}
          </div>
        )}
      </div>

      {resolvidos.length > 0 && (
        <div>
          <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] mb-3">
            Resolvidos ({resolvidos.length})
          </p>
          <div className="space-y-2">
            {resolvidos.map((p, i) => (
              <ItemCompra key={p.id} pedido={p} loja={nomeLoja(p)} index={i} onUpdate={onUpdate} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ItemCompra({ pedido, loja, index, onUpdate }: { pedido: Pedido; loja: string; index: number; onUpdate: () => void }) {
  const [salvando, setSalvando] = useState(false)
  const resolvido = STATUS_RESOLVIDO.includes(pedido.status)

  async function marcar(novo: PedidoStatus) {
    setSalvando(true)
    await fetch(`/api/pedidos/${pedido.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novo }),
    })
    onUpdate()
    setSalvando(false)
  }

  return (
    <div className={`flex gap-3 items-start rounded-xl border ${corBorda(index)} p-3 ${resolvido ? 'opacity-60' : ''}`}>
      {pedido.printUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pedido.printUrl} alt="Print" className="w-11 h-11 object-cover shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <TipoBadge tipo={pedido.tipo} />
          <span className="text-[10px] font-archivo text-[#525252] truncate">{loja}</span>
        </div>
        <p className={`text-xs font-archivo text-[#0A0A0A] leading-snug mt-1 ${resolvido ? 'line-through text-[#525252]' : ''}`}>
          {pedido.descricao}
        </p>
        <SiteCliente site={pedido.siteUrl} />
        <p className="text-[10px] font-archivo text-[#525252] mt-0.5">Para: {pedido.clienteNome}</p>

        {resolvido ? (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[9px] font-archivo font-medium tracking-widest uppercase text-[#525252]">
              {RESOLVIDO_LABEL[pedido.status] ?? 'Resolvido'}
            </span>
            <button
              onClick={() => marcar('pendente')}
              disabled={salvando}
              className="flex items-center gap-1 text-[9px] font-archivo font-medium tracking-widest uppercase
                text-[#525252] hover:text-[#0A0A0A] transition-colors disabled:opacity-50"
            >
              <RotateCcw size={10} /> Desfazer
            </button>
          </div>
        ) : (
          <button
            onClick={() => marcar('nao_tinha')}
            disabled={salvando}
            className="text-[9px] font-archivo font-medium tracking-widest uppercase text-[#525252]
              hover:text-[#0A0A0A] transition-colors mt-2 disabled:opacity-50"
          >
            Não tinha
          </button>
        )}
      </div>

      {!resolvido && (
        <button
          onClick={() => marcar('comprei')}
          disabled={salvando}
          title="Marcar como comprado"
          className="shrink-0 flex items-center gap-1.5 bg-[#0A0A0A] text-[#FAFAFA] text-[9px] font-archivo
            font-medium tracking-widest uppercase px-3 py-2 transition-all hover:bg-[#262626] disabled:opacity-50"
        >
          <Check size={12} /> Comprei
        </button>
      )}
    </div>
  )
}

function PedidoAdminItem({ pedido, onUpdate }: { pedido: Pedido; onUpdate: () => void }) {
  const [status, setStatus] = useState<PedidoStatus>(pedido.status)
  const [resposta, setResposta] = useState(pedido.respostaImportadora ?? '')
  const [salvando, setSalvando] = useState(false)
  const [verContato, setVerContato] = useState(false)

  async function salvar() {
    setSalvando(true)
    await fetch(`/api/pedidos/${pedido.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, respostaImportadora: resposta }),
    })
    onUpdate()
    setSalvando(false)
  }

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3">
        {pedido.printUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pedido.printUrl} alt="Print" className="w-12 h-12 object-cover shrink-0 cursor-pointer"
            onClick={() => window.open(pedido.printUrl, '_blank')} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <TipoBadge tipo={pedido.tipo} />
            <p className="text-xs font-archivo font-medium text-[#0A0A0A]">{pedido.clienteNome}</p>
          </div>
          <p className="text-xs font-archivo text-[#A3A3A3] leading-tight line-clamp-3">{pedido.descricao}</p>
          <SiteCliente site={pedido.siteUrl} />
          <button
            onClick={() => setVerContato(!verContato)}
            className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] hover:text-[#0A0A0A] transition-colors mt-1"
          >
            {verContato ? 'Esconder contato' : 'Ver contato'}
          </button>
        </div>
      </div>

      {verContato && (
        <div className="mt-2">
          <ContatoCliente nome={pedido.clienteNome} telefone={pedido.clienteTelefone} email={pedido.clienteEmail} />
        </div>
      )}

      <div className="mt-3 space-y-2">
        <select
          value={status}
          onChange={e => setStatus(e.target.value as PedidoStatus)}
          className="w-full rounded-xl border border-[#2D6CDF] bg-white text-[#0A0A0A] px-3 py-2 text-xs font-archivo
            focus:outline-none focus:border-[#0A0A0A] appearance-none cursor-pointer"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <input
          type="text"
          value={resposta}
          onChange={e => setResposta(e.target.value)}
          placeholder="Mensagem para o cliente (opcional)"
          className="w-full rounded-xl border border-[#2D6CDF] bg-transparent text-[#0A0A0A] px-3 py-2 text-xs font-archivo
            focus:outline-none focus:border-[#0A0A0A] placeholder:text-[#A3A3A3]"
        />

        <button
          onClick={salvar}
          disabled={salvando}
          className="w-full rounded-xl border border-[#2D6CDF] text-[#0A0A0A] text-[10px] font-archivo font-medium
            tracking-widest uppercase py-2 transition-colors hover:border-[#0A0A0A] disabled:opacity-50"
        >
          {salvando ? '...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
