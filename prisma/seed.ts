import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const lojas = [
    { id: 'sephora', nome: 'Sephora', siteUrl: 'https://www.sephora.com', statusAtual: 'mais_tarde', ordem: 1 },
    { id: 'apple', nome: 'Apple Store', siteUrl: 'https://www.apple.com', statusAtual: 'amanha', ordem: 2 },
    { id: 'nike', nome: 'Nike', siteUrl: 'https://www.nike.com', statusAtual: 'em_breve', horarioEstimado: '14h', ordem: 3 },
    { id: 'coach', nome: 'Coach Outlet', siteUrl: 'https://www.coachoutlet.com', statusAtual: 'mais_tarde', ordem: 4 },
    { id: 'amazon', nome: 'Amazon', siteUrl: 'https://www.amazon.com', statusAtual: 'sempre', ordem: 5 },
  ]

  for (const loja of lojas) {
    await prisma.loja.upsert({ where: { id: loja.id }, update: loja, create: loja })
  }
  console.log('✓ Lojas criadas')

  // Clear in FK-safe order: reservations reference products, so they go first.
  await prisma.reservaCliente.deleteMany({})
  await prisma.produto.deleteMany({})

  const produtosSeed = [
    { lojaId: 'sephora', nome: 'Sephora Collection Perfume', fotoUrl: '', precoOriginalUSD: 28, precoVendaBRL: 189, temDesconto: true, qtdDisponivel: 3 },
    { lojaId: 'apple', nome: 'AirPods Pro (2ª geração)', fotoUrl: '', precoOriginalUSD: 249, precoVendaBRL: 1490, temDesconto: true, qtdDisponivel: 2 },
    { lojaId: 'nike', nome: 'Nike Air Max 270', fotoUrl: '', precoOriginalUSD: 150, precoVendaBRL: 890, temDesconto: false, qtdDisponivel: 1 },
    { lojaId: 'coach', nome: 'Coach Mini Bag', fotoUrl: '', precoOriginalUSD: 195, precoVendaBRL: 1150, temDesconto: true, qtdDisponivel: 2 },
  ]

  for (const p of produtosSeed) {
    await prisma.produto.create({ data: p })
  }
  console.log('✓ Produtos seed criados')
  console.log('Seed completo.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
