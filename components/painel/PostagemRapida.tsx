'use client'

import { useState, useRef } from 'react'
import { Camera, Plus, Minus } from 'lucide-react'

type Props = {
  lojaId: string
  onPublicado: () => void
}

export function PostagemRapida({ lojaId, onPublicado }: Props) {
  const [nome, setNome] = useState('')
  const [temDesconto, setTemDesconto] = useState(false)
  const [precoUSD, setPrecoUSD] = useState('')
  const [precoBRL, setPrecoBRL] = useState('')
  const [qtd, setQtd] = useState(1)
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [publicado, setPublicado] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function selecionarFoto(file: File) {
    // Compress in browser before upload — keeps the feed fast
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 1200
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (!blob) return
            const compressed = new File([blob], file.name, { type: 'image/jpeg' })
            setFoto(compressed)
            setPreview(canvas.toDataURL('image/jpeg', 0.8))
          },
          'image/jpeg',
          0.8
        )
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  async function handlePublicar() {
    if (!nome.trim() || !precoBRL || !foto) return
    setLoading(true)

    // Upload image first
    const form = new FormData()
    form.append('file', foto)
    form.append('prefix', 'produto')
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
    const { url: fotoUrl } = await uploadRes.json()

    await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lojaId,
        nome: nome.trim(),
        fotoUrl,
        // Original USD price only matters when she marks it as a discount.
        precoOriginalUSD: temDesconto ? parseFloat(precoUSD) || 0 : 0,
        precoVendaBRL: parseFloat(precoBRL.replace(',', '.')),
        temDesconto,
        qtdDisponivel: qtd,
      }),
    })

    setPublicado(true)
    setNome('')
    setTemDesconto(false)
    setPrecoUSD('')
    setPrecoBRL('')
    setQtd(1)
    setFoto(null)
    setPreview('')
    onPublicado()
    setTimeout(() => setPublicado(false), 2000)
    setLoading(false)
  }

  return (
    <div className="border border-[#262626] p-4">
      <p className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] mb-4">
        Postagem rápida
      </p>

      {/* FOTO */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => e.target.files?.[0] && selecionarFoto(e.target.files[0])}
      />
      <div
        onClick={() => fileRef.current?.click()}
        className="w-full aspect-[4/3] bg-[#0A0A0A] border border-[#262626] flex items-center justify-center
          cursor-pointer hover:border-[#525252] transition-colors mb-4 overflow-hidden relative"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#525252]">
            <Camera size={28} />
            <p className="text-[10px] font-archivo tracking-widest uppercase">Tirar foto</p>
          </div>
        )}
        {/* VIDEO SLOT: substitua esta div por <video autoPlay muted loop playsInline> para adicionar vídeo decorativo */}
      </div>

      {/* CAMPOS */}
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] block mb-1.5">
            Nome do produto
          </label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Perfume Viktor&Rolf 90ml"
            className="w-full border border-[#262626] bg-transparent px-3 py-2.5 text-sm font-archivo text-[#FAFAFA]
              focus:outline-none focus:border-[#525252] transition-colors placeholder:text-[#262626]"
          />
        </div>

        {/* TOGGLE DESCONTO — controla se mostra o preço antigo riscado */}
        <button
          type="button"
          onClick={() => setTemDesconto(!temDesconto)}
          className="flex items-center justify-between w-full border border-[#262626] px-3 py-2.5 transition-colors hover:border-[#525252]"
        >
          <span className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252]">
            Está com desconto?
          </span>
          <span className={`relative w-9 h-5 rounded-full transition-colors ${temDesconto ? 'bg-[#E63946]' : 'bg-[#262626]'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#FAFAFA] transition-transform ${temDesconto ? 'translate-x-4' : ''}`} />
          </span>
        </button>

        <div className={`grid gap-3 ${temDesconto ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {temDesconto && (
            <div>
              <label className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] block mb-1.5">
                Preço US$ (riscado)
              </label>
              <input
                type="number"
                value={precoUSD}
                onChange={e => setPrecoUSD(e.target.value)}
                placeholder="0"
                className="w-full border border-[#262626] bg-transparent px-3 py-2.5 text-sm font-archivo text-[#FAFAFA]
                  focus:outline-none focus:border-[#525252] transition-colors placeholder:text-[#262626]"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] block mb-1.5">
              Preço R$ (venda) *
            </label>
            <input
              type="number"
              value={precoBRL}
              onChange={e => setPrecoBRL(e.target.value)}
              placeholder="0"
              className="w-full border border-[#262626] bg-transparent px-3 py-2.5 text-sm font-archivo text-[#FAFAFA]
                focus:outline-none focus:border-[#525252] transition-colors placeholder:text-[#262626]"
            />
          </div>
        </div>

        {/* STEPPER DE QUANTIDADE */}
        <div>
          <label className="text-[10px] font-archivo font-medium tracking-widest uppercase text-[#525252] block mb-1.5">
            Quantidade disponível
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQtd(Math.max(1, qtd - 1))}
              className="w-10 h-10 border border-[#262626] flex items-center justify-center text-[#FAFAFA]
                hover:border-[#525252] transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="font-display text-2xl font-medium text-[#FAFAFA] w-8 text-center tabular-nums">
              {qtd}
            </span>
            <button
              onClick={() => setQtd(qtd + 1)}
              className="w-10 h-10 border border-[#262626] flex items-center justify-center text-[#FAFAFA]
                hover:border-[#525252] transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <button
          onClick={handlePublicar}
          disabled={loading || !nome || !precoBRL || !foto}
          className="w-full bg-[#FAFAFA] text-[#0A0A0A] font-archivo text-xs font-medium tracking-widest uppercase py-3.5
            transition-all hover:bg-[#E5E5E5] disabled:opacity-30 mt-2"
        >
          {publicado ? '✓ Publicado!' : loading ? 'Publicando...' : 'Publicar no Feed'}
        </button>
      </div>
    </div>
  )
}
