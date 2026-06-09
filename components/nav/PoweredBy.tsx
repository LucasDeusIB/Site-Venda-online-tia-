import { BRAND } from '@/lib/theme/brand'

// Tiny, discreet "powered by" credit. Just the maker of the site, never the brand.
export function PoweredBy({ dark = false }: { dark?: boolean }) {
  return (
    <p
      className={`font-archivo text-[9px] tracking-[0.25em] uppercase ${
        dark ? 'text-[#525252]' : 'text-[#A3A3A3]'
      }`}
    >
      powered by {BRAND.maker}
    </p>
  )
}
