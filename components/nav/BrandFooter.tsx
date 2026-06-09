import { BRAND } from '@/lib/theme/brand'
import { PoweredBy } from './PoweredBy'

// Footer signature: the store brand, with a tiny maker credit beneath.
export function BrandFooter() {
  return (
    <footer className="py-12 text-center space-y-2">
      <p className="font-archivo text-[10px] font-medium tracking-[0.35em] uppercase text-[#A3A3A3]">
        {BRAND.loja}
      </p>
      <PoweredBy />
    </footer>
  )
}
