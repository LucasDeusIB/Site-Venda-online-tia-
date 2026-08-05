import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Extensão SEMPRE derivada de uma allowlist pelo tipo MIME — nunca do file.name.
// Isso impede que um nome tipo "evil.html" seja salvo/servido como HTML (XSS
// armazenado). O endpoint /api/upload já valida que o tipo está nesta lista.
const EXTENSAO: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

function nomeSeguro(file: File, prefix: string): string {
  const ext = EXTENSAO[file.type] ?? 'jpg'
  const rand = Math.random().toString(36).slice(2, 8)
  const base = prefix.replace(/[^a-z0-9]/gi, '_').slice(0, 20) || 'img'
  return `${base}-${Date.now()}-${rand}.${ext}`
}

// Uploads an image and returns its public URL.
// Production: Vercel Blob. Dev fallback: /public/uploads.
export async function uploadImage(file: File, prefix = 'img'): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const filename = nomeSeguro(file, prefix)

  if (token) {
    // Vercel Blob — store URL in DB, never the bytes. contentType fixo pelo MIME
    // validado, para o Blob nunca servir com um content-type perigoso.
    const { put } = await import('@vercel/blob')
    const blob = await put(filename, file, {
      access: 'public',
      token,
      contentType: file.type,
    })
    return blob.url
  }

  // Local dev fallback — saves to /public/uploads
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  const dest = path.join(uploadsDir, filename)
  const bytes = await file.arrayBuffer()
  await writeFile(dest, Buffer.from(bytes))
  return `/uploads/${filename}`
}
