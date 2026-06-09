import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Archivo } from 'next/font/google'
import './globals.css'

const displayFont = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const bodyFont = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Compras da Ca e Dani — Importados ao Vivo',
  description: 'Produtos direto dos EUA, comprados ao vivo, entregues no Brasil.',
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="bg-[#FAFAFA] text-[#0A0A0A] antialiased min-h-screen font-archivo">
        {children}
      </body>
    </html>
  )
}
