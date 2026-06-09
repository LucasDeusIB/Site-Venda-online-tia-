'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Produto } from '@/lib/data/types'
import { ReservaModal } from './ReservaModal'

type Props = {
  produto: Produto
  index: number
  isNew?: boolean
}

export function ProdutoCard({ produto, index, isNew }: Props) {
  const [showModal, setShowModal] = useState(false)
  // Estoque ilimitado: só fica indisponível se a staff marcar como esgotado.
  const esgotado = produto.status === 'esgotado'
  const temDesconto = produto.temDesconto && produto.precoOriginalUSD > 0

  return (
    <>
      <article
        className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)} relative`}
      >
        {isNew && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[#0A0A0A] text-[#FAFAFA] text-[10px] font-archivo font-medium tracking-widest uppercase px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E63946] animate-pulse-live" />
            Chegou agora
          </div>
        )}

        {/* IMAGE — the product is the hero */}
        <div className="relative w-full aspect-[4/5] bg-[#F5F5F5] overflow-hidden group cursor-pointer photo-shadow"
          onClick={() => !esgotado && setShowModal(true)}>

          {/* VIDEO SLOT: substitua esta div por <video autoPlay muted loop playsInline> para adicionar vídeo decorativo */}

          {produto.fotoUrl ? (
            <Image
              src={produto.fotoUrl}
              alt={produto.nome}
              fill
              className={`object-cover transition-transform duration-700 group-hover:scale-[1.03]
                ${esgotado ? 'opacity-40 grayscale' : ''}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-[#262626]" />
          )}

          {esgotado && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[#FAFAFA] font-archivo text-xs font-medium tracking-widest uppercase bg-[#0A0A0A]/80 px-4 py-2">
                Esgotado
              </span>
            </div>
          )}
        </div>

        {/* INFO STRIP */}
        <div className="pt-3 pb-5 px-0.5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] mb-0.5">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="font-display text-base font-medium leading-tight text-[#0A0A0A] line-clamp-2">
                {produto.nome}
              </h3>
            </div>
            <div className="text-right shrink-0 pt-4">
              {temDesconto && (
                <p className="text-xs font-archivo text-[#A3A3A3] line-through leading-none mb-1">
                  US$ {produto.precoOriginalUSD.toFixed(0)}
                </p>
              )}
              <p className="text-[9px] font-archivo tracking-widest uppercase text-[#A3A3A3] leading-none mb-0.5">
                somente
              </p>
              <p className="font-archivo font-medium text-[#0A0A0A] text-sm leading-none">
                R$ {produto.precoVendaBRL.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {!esgotado && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 w-full bg-[#0A0A0A] text-[#FAFAFA] font-archivo text-xs font-medium tracking-widest uppercase py-3 px-4
                transition-all duration-200 hover:bg-[#262626] active:scale-[0.98]"
            >
              Comprar
            </button>
          )}
        </div>
      </article>

      {showModal && (
        <ReservaModal produto={produto} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
