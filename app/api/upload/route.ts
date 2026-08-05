import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/storage'
import { isStaff } from '@/lib/auth-staff'
import { checarOrigem } from '@/lib/mesma-origem'

const TIPOS_OK = ['image/png', 'image/jpeg', 'image/webp']
const TAMANHO_MAX = 8 * 1024 * 1024 // 8MB

// Só a staff envia imagens. Antes o endpoint era ANÔNIMO: qualquer um gravava no
// Vercel Blob (cobrado) — abuso de storage e hospedagem de conteúdo arbitrário.
export async function POST(req: NextRequest) {
  const bloqueio = checarOrigem(req)
  if (bloqueio) return bloqueio
  if (!(await isStaff())) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  const prefix = (form?.get('prefix') as string) || 'img'

  if (!(file instanceof File) || !TIPOS_OK.includes(file.type)) {
    return NextResponse.json({ erro: 'Envie uma imagem PNG, JPG ou WEBP' }, { status: 400 })
  }
  if (file.size > TAMANHO_MAX) {
    return NextResponse.json({ erro: 'Imagem grande demais (máx 8MB)' }, { status: 400 })
  }

  const url = await uploadImage(file, prefix)
  return NextResponse.json({ url })
}
