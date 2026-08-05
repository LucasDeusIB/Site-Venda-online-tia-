// URLs vindas de usuário (site da loja, print) podem conter esquemas perigosos
// como `javascript:` ou `data:`. Só http/https é aceito — o resto vira null e
// nunca deve ir para um href.
export function urlSegura(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const bruto = valor.trim()
  if (!bruto) return null
  try {
    const u = new URL(bruto)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}

// Imagens do app vêm do /api/upload como URL do Vercel Blob (https) ou, em dev,
// caminho relativo /uploads/<nome>. Aceitamos só esses dois formatos.
export function imagemSegura(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const bruto = valor.trim()
  if (!bruto) return null
  if (/^\/uploads\/[A-Za-z0-9._-]+$/.test(bruto)) return bruto
  return urlSegura(bruto)
}
