import type { NextConfig } from 'next'

// CSP compatível com Next (App Router) + next/font (fontes self-hosted). Imagens
// vêm do Vercel Blob, então img-src libera os hosts *.vercel-storage.com (mais
// data:/blob: para prévias no painel). 'unsafe-inline' em script/style é
// necessário para a hidratação/estilos do Next; como a UI é React (escapa saída)
// e não usa dangerouslySetInnerHTML, a superfície de XSS é mínima.
// Em desenvolvimento o React usa eval() para debugging; em produção nunca usa.
// Por isso 'unsafe-eval' entra SÓ em dev — produção fica estrita.
const scriptSrc =
  process.env.NODE_ENV === 'production'
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'"

const csp = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.vercel-storage.com https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
]

const nextConfig: NextConfig = {
  allowedDevOrigins: ['direction-catalogs-antiques-join.trycloudflare.com'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.vercel-storage.com' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
