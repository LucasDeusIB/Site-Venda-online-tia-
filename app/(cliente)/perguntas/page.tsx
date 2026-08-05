import { PerguntasCliente } from '@/components/perguntas/PerguntasCliente'

export const metadata = { title: 'Perguntas — Compras da Ca e Dani' }

export default function PerguntasPage() {
  return (
    <div className="max-w-[480px] mx-auto px-5">
      <header className="pt-12 pb-8">
        <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#A3A3A3] mb-2">
          04
        </p>
        <h1 className="font-display text-2xl font-medium">Perguntas</h1>
        <p className="text-sm font-archivo text-[#A3A3A3] mt-2 leading-relaxed">
          Fale direto com a equipe. A conversa é só sua — ninguém mais vê.
        </p>
      </header>
      <PerguntasCliente />
      <footer className="py-12 text-center">
        <p className="font-archivo text-[10px] font-medium tracking-[0.35em] uppercase text-[#A3A3A3]">
          Compras da Ca e Dani
        </p>
      </footer>
    </div>
  )
}
