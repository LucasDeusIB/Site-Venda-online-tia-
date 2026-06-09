'use client'

import { useState } from 'react'
import { Copy, Check, MessageCircle } from 'lucide-react'

// Requester contact for the operator. The phone is intentionally the most
// prominent line: she copies it to open WhatsApp in another app and clear doubts.
export function ContatoCliente({
  nome,
  telefone,
  email,
}: {
  nome: string
  telefone: string
  email?: string
}) {
  const [copiado, setCopiado] = useState(false)
  const digits = telefone.replace(/\D/g, '')
  // Brazilian numbers on wa.me need the country code (55).
  const waNumber = digits.length <= 11 ? `55${digits}` : digits

  function copiar() {
    navigator.clipboard.writeText(telefone)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-[#2D6CDF] p-3 space-y-2">
      <div>
        <p className="text-[9px] font-archivo font-medium tracking-widest uppercase text-[#525252]">De / para</p>
        <p className="font-archivo text-sm font-medium text-[#0A0A0A]">{nome}</p>
      </div>

      <div>
        <p className="text-[9px] font-archivo font-medium tracking-widest uppercase text-[#525252] mb-1">WhatsApp</p>
        <div className="flex items-center gap-2">
          <span className="flex-1 font-display text-lg font-medium text-[#0A0A0A] tabular-nums tracking-wide">
            {telefone}
          </span>
          <button
            onClick={copiar}
            className="shrink-0 flex items-center gap-1 rounded-xl border border-[#2D6CDF] text-[#0A0A0A] text-[10px] font-archivo
              font-medium tracking-wider uppercase px-2.5 py-1.5 transition-colors hover:border-[#0A0A0A]"
          >
            {copiado ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
          </button>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 rounded-xl bg-[#0A0A0A] text-[#FAFAFA] text-[10px] font-archivo
              font-medium tracking-wider uppercase px-2.5 py-1.5 transition-colors hover:bg-[#262626]"
          >
            <MessageCircle size={11} /> Abrir
          </a>
        </div>
      </div>

      {email && (
        <div>
          <p className="text-[9px] font-archivo font-medium tracking-widest uppercase text-[#525252]">E-mail (avisos)</p>
          <p className="font-archivo text-xs text-[#A3A3A3] break-all">{email}</p>
        </div>
      )}
    </div>
  )
}
