import { FloatingNavCliente } from '@/components/nav/FloatingNavCliente'
import { DecorBalls } from '@/components/decor/DecorBalls'
import { GarantirSessao } from '@/components/entrada/GarantirSessao'

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  // No opaque background here on purpose: the body is already white, so the
  // decorative balls (z-0) can show through the empty side gutters on desktop.
  return (
    <div className="min-h-screen">
      <GarantirSessao />
      <DecorBalls />
      <div className="relative z-10">
        {children}
        <FloatingNavCliente />
        <div className="h-28" /> {/* space for floating nav */}
      </div>
    </div>
  )
}
