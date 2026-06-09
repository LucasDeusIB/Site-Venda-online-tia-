'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, ShoppingBag, Map, Heart } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string      // cor da aba ativa
  darkText?: boolean // texto escuro quando o fundo da aba é claro (amarelo)
}

const navItems: NavItem[] = [
  { href: '/ao-vivo', label: 'Ao Vivo', icon: Zap, color: 'var(--c-red)' },
  { href: '/pedir', label: 'Pedir', icon: ShoppingBag, color: 'var(--c-yellow)', darkText: true },
  { href: '/roteiro', label: 'Roteiro', icon: Map, color: 'var(--c-blue)' },
  { href: '/minhas-compras', label: 'Minhas', icon: Heart, color: 'var(--c-red)' },
]

export function FloatingNav({
  badges = {},
  dots = {},
}: {
  badges?: Record<string, number>
  // Pontinho de novidade (sem número) por href de aba.
  dots?: Record<string, boolean>
}) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-2 py-2 bg-[#0A0A0A] rounded-full menu-shadow">
        {navItems.map(({ href, label, icon: Icon, color, darkText }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          const badge = badges[href] ?? 0
          const dot = dots[href] ?? false

          return (
            <Link
              key={href}
              href={href}
              style={isActive ? { backgroundColor: color, color: darkText ? '#0A0A0A' : '#FAFAFA' } : undefined}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition-all duration-200
                ${isActive ? '' : 'text-[#A3A3A3] hover:text-[#FAFAFA]'}`}
            >
              {/* key alterna ao ativar → remonta o ícone → o "jump" toca de novo */}
              <Icon
                key={isActive ? 'on' : 'off'}
                size={18}
                className={`shrink-0 ${isActive ? 'animate-tab-jump' : ''}`}
              />
              <span className="text-[10px] font-archivo font-medium tracking-wider uppercase leading-none">
                {label}
              </span>
              {badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#E63946] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              {/* Pontinho de novidade (sem número) — some quando o cliente abre a aba */}
              {badge === 0 && dot && (
                <span className="absolute top-0.5 right-1.5 w-2 h-2 bg-[#E63946] rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
