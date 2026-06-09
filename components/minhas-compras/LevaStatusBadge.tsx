import type { LevaStatus } from '@/lib/data/types'

const LABELS: Record<LevaStatus, string> = {
  a_caminho: 'A caminho',
  no_brasil: 'No Brasil',
  saiu_entrega: 'Saiu para entrega',
  entregue: 'Entregue',
}

// Mesma linguagem visual dos badges editoriais já usados (preto/cinza).
const STYLES: Record<LevaStatus, string> = {
  a_caminho: 'bg-[#E5E5E5] text-[#525252]',
  no_brasil: 'bg-[#E5E5E5] text-[#525252]',
  saiu_entrega: 'bg-[#0A0A0A] text-[#FAFAFA]',
  entregue: 'bg-[#0A0A0A] text-[#FAFAFA]',
}

export function LevaStatusBadge({ status }: { status: LevaStatus }) {
  return (
    <span className={`shrink-0 text-[9px] font-archivo font-medium tracking-widest uppercase px-2.5 py-1 ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
