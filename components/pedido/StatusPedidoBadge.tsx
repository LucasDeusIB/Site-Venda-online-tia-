import type { PedidoStatus } from '@/lib/data/types'

const LABELS: Record<PedidoStatus, string> = {
  pendente: 'Pendente',
  consigo: 'Consigo',
  vou_ver: 'Vou ver',
  nao_consigo: 'Não consigo',
  achei: 'Achei!',
  comprei: 'Comprou',
  nao_tinha: 'Não tinha',
}

const STYLES: Record<PedidoStatus, string> = {
  pendente: 'bg-[#F5F5F5] text-[#A3A3A3]',
  consigo: 'bg-[#0A0A0A] text-[#FAFAFA]',
  vou_ver: 'bg-[#E5E5E5] text-[#525252]',
  nao_consigo: 'bg-[#F5F5F5] text-[#A3A3A3] line-through',
  achei: 'bg-[#0A0A0A] text-[#FAFAFA]',
  comprei: 'bg-[#0A0A0A] text-[#FAFAFA]',
  nao_tinha: 'bg-[#F5F5F5] text-[#A3A3A3]',
}

export function StatusPedidoBadge({ status }: { status: PedidoStatus }) {
  return (
    <span className={`shrink-0 rounded-md text-[9px] font-archivo font-medium tracking-widest uppercase px-2.5 py-1 ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
