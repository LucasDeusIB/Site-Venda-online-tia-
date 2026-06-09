import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Uploads an image and returns its public URL.
// Production: Vercel Blob. Dev fallback: /public/uploads.
export async function uploadImage(file: File, prefix = 'img'): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN

  if (token) {
    // Vercel Blob — store URL in DB, never the bytes
    const { put } = await import('@vercel/blob')
    const filename = `${prefix}-${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
    const blob = await put(filename, file, { access: 'public', token })
    return blob.url
  }

  // Local dev fallback — saves to /public/uploads
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  const filename = `${prefix}-${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
  const dest = path.join(uploadsDir, filename)
  const bytes = await file.arrayBuffer()
  await writeFile(dest, Buffer.from(bytes))
  return `/uploads/${filename}`
}
