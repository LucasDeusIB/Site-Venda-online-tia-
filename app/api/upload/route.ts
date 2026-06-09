import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const prefix = (form.get('prefix') as string) || 'img'

  if (!file) return NextResponse.json({ erro: 'Arquivo não enviado' }, { status: 400 })

  const url = await uploadImage(file, prefix)
  return NextResponse.json({ url })
}
