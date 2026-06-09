# Como Editar o CORE¡Q. — Guia para Iniciantes

Este guia explica como fazer as alterações mais comuns sem precisar entender código.

---

## 1. Como mudar o preço de um produto

**Pelo painel (sem tocar em código):**
1. Acesse `/painel` no navegador e faça login com a senha do painel.
2. Na aba **Feed & Postagem**, você vê todos os produtos publicados.
3. Para remover um produto e repostar com outro preço, clique no ícone de lixeira e use o formulário de **Postagem Rápida**.

Se precisar editar direto no banco (dev):
```bash
npx prisma studio
```
Isso abre uma interface visual onde você pode editar qualquer campo.

---

## 2. Como adicionar uma nova loja no roteiro

Abra o arquivo `prisma/seed.ts` e adicione a loja no array:

```typescript
{ id: 'zara', nome: 'Zara', siteUrl: 'https://www.zara.com', statusAtual: 'mais_tarde', ordem: 6 },
```

Depois rode:
```bash
npx tsx prisma/seed.ts
```

Ou use `npx prisma studio` para adicionar diretamente no banco.

> **IDs de loja:** use só letras minúsculas e hífens (ex: `coach-outlet`). Nunca use `¡` no ID.

---

## 3. Como trocar a chave PIX

Abra o arquivo `.env` e edite estas linhas:

```env
PIX_KEY="sua.chave@aqui.com"
PIX_NAME="NOME QUE APARECE NO PIX"
```

Salve e reinicie o servidor (`npm run dev`).

---

## 4. Como mudar a cor de destaque (vermelho `#E63946`)

Abra `lib/theme/tokens.ts` e mude o valor de `accent`:

```typescript
colors: {
  accent: '#E63946',  // ← mude aqui
}
```

Atenção: essa cor só deve aparecer em badges (notificações) e no indicador "ao vivo". Mudar isso muda o visual de toda a plataforma.

---

## 5. Onde colocar um vídeo de fundo decorativo

Procure nos arquivos pelos comentários `VIDEO SLOT`:

```
// VIDEO SLOT: substitua esta div por <video autoPlay muted loop playsInline>
```

Você encontrará esses comentários em:
- `components/feed/FeedAoVivo.tsx` — no feed principal (estado vazio)
- `components/produto/ProdutoCard.tsx` — atrás da foto do produto
- `components/painel/PostagemRapida.tsx` — na área de preview de foto

Para adicionar um vídeo, substitua a `<div>` pelo código:

```tsx
<video autoPlay muted loop playsInline className="w-full h-full object-cover">
  <source src="/seu-video.mp4" type="video/mp4" />
</video>
```

Coloque o arquivo `.mp4` na pasta `public/`.

---

## 6. Como trocar as fontes

Todas as fontes estão centralizadas em `lib/theme/tokens.ts` e carregadas em `app/layout.tsx`.

Para trocar a fonte de títulos (atual: Playfair Display):
1. Abra `app/layout.tsx`
2. Troque `Playfair_Display` por outra fonte do Google Fonts (ex: `Cormorant_Garamond`)
3. O `--font-display` vai atualizar automaticamente em todo o site

> Nunca use Inter, Roboto ou fontes de sistema — são visualmente genéricas.

---

## 7. Como fazer deploy no Vercel

### Primeira vez:
1. Crie uma conta em [vercel.com](https://vercel.com) (gratuito)
2. Conecte seu repositório GitHub
3. Clique em "Import" e selecione o projeto
4. Configure as variáveis de ambiente (ver seção abaixo)
5. Clique em "Deploy"

### Variáveis de ambiente no Vercel:
No painel do Vercel, vá em **Settings → Environment Variables** e adicione:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | URL do banco Neon (Postgres) |
| `PANEL_PASSWORD` | Sua senha do painel |
| `PIX_KEY` | Sua chave PIX |
| `PIX_NAME` | Nome que aparece no PIX |
| `BLOB_READ_WRITE_TOKEN` | Token do Vercel Blob (para fotos) |

### Banco de dados em produção (Neon):
1. Crie conta em [neon.tech](https://neon.tech) (gratuito)
2. Crie um novo projeto e copie a Connection String
3. Cole em `DATABASE_URL` no Vercel
4. Rode as migrations: `npx prisma db push` localmente apontando para o Neon
5. Rode o seed: `npx tsx prisma/seed.ts` (com a variável DATABASE_URL do Neon)

### Vercel Blob (fotos):
1. No painel do Vercel, vá em **Storage → Create Database → Blob**
2. Copie o token gerado
3. Cole em `BLOB_READ_WRITE_TOKEN`

---

## 8. Quando for adicionar cartão de crédito

Antes de implementar, decida com a importadora:

- [ ] CNPJ de empresa ou CPF pessoa física?
- [ ] Receber em reais (Brasil) ou dólar (EUA)?
- [ ] Parcelamento com ou sem juros para o cliente?
- [ ] Qual provedor? (Mercado Pago, Stripe, Pagar.me, etc.)

Depois de decidir:
1. Abra `lib/payments/cartao.ts` — está com instruções comentadas
2. Implemente `CartaoProvider` seguindo a interface `PaymentProvider`
3. **Nada mais muda** — as telas, APIs e banco já estão preparados

O arquivo `app/api/pagamento/webhook/` já existe para receber a confirmação automática do provedor — só implemente a lógica lá.

---

## 9. Variáveis de ambiente locais (`.env`)

```env
DATABASE_URL="file:./dev.db"        # banco local SQLite
PANEL_PASSWORD="coreiq2024"          # senha do painel (mude antes de publicar!)
PIX_KEY="sua@chave.pix"             # chave PIX para receber pagamentos
PIX_NAME="NOME DO PIX"              # nome que aparece na transferência
BLOB_READ_WRITE_TOKEN=""            # deixe vazio no dev (salva em /public/uploads)
```

> **IMPORTANTE:** nunca suba o arquivo `.env` para o GitHub. Ele já está no `.gitignore`.

---

## 10. Comandos úteis no terminal

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Ver/editar banco de dados visualmente
npx prisma studio

# Recriar banco com dados de exemplo
npx tsx prisma/seed.ts

# Verificar erros de TypeScript
npx tsc --noEmit

# Fazer build para produção
npm run build
```

---

## 11. Como mudar a data da próxima leva

A "próxima leva" é a data geral (uma só, válida para todas) em que a próxima
remessa chega no Brasil. Quem edita é a importadora, pelo painel:

1. Acesse `/painel` e faça login.
2. Abra a aba **Entrega**.
3. Preencha:
   - **Data prevista** — a data que aparece para as clientes (ex: 15/08).
   - **Status do envio** — escolha entre: *A caminho*, *No Brasil*,
     *Saiu para entrega* ou *Entregue*.
4. Clique em **Salvar**.

Pronto: o bloco **"Próxima leva de entrega"** no topo de *Minhas Compras* atualiza
sozinho para todas as clientes (em alguns segundos). Enquanto não houver data
definida, elas veem "Próxima data de entrega ainda não definida".

> É uma data única e geral — não é por pedido nem por cliente.

---

## 12. Como funciona o pontinho vermelho de novidades

As abas do app (Ao Vivo, Pedir, Minhas) podem mostrar um **pontinho vermelho**
quando há algo novo para aquela cliente. É só um indicador visual — sem número,
sem e-mail. O pontinho **some assim que a cliente abre aquela aba**.

Ele aparece quando:
- **Ao Vivo** — você posta um produto novo no feed.
- **Pedir** — você responde ou muda o status de um pedido daquela cliente.
- **Minhas** — você muda a data ou o status da próxima leva (aba Entrega).

Cada cliente tem o seu próprio pontinho: a novidade de uma não afeta a outra.
Não precisa configurar nada — funciona automaticamente.

---

## 13. Como funciona a identidade da cliente (e-mail + telefone)

Cada cliente é identificada pelo par **e-mail + telefone** — os dois juntos são a
conta dela. Na tela inicial ela digita **nome, e-mail e telefone** e entra. Não há
senha nem código de verificação: é simples de propósito, para substituir o grupo de
WhatsApp sem fricção.

- **Mesmo e-mail + mesmo telefone** → sempre cai na mesma conta (vê os mesmos
  pedidos e compras).
- **E-mail ou telefone diferente** → é outra conta, com dados separados.
- Cada cliente só enxerga **os próprios** pedidos e compras. Ninguém vê os dados de
  outra pessoa.

> **Trade-off consciente:** quem souber o e-mail E o telefone de alguém consegue
> entrar na conta dela. Para este contexto (amigas/clientes conhecidas) é suficiente.

O **painel da equipe** continua protegido pela senha de staff e enxerga **todos** os
pedidos e compras — isso é o trabalho de vocês.

---

## 14. Como funciona o pagamento (PIX por enquanto)

Quando a cliente toca em **Comprar**, ela vê a **chave PIX** para pagar. Depois do
pagamento, vocês confirmam na aba **PIX** do painel e a cliente vê "Pago" em
*Minhas Compras*.

- **Estoque é ilimitado:** várias clientes podem comprar o mesmo item. Não há
  reserva por tempo nem corrida de "quem clica primeiro".
- O combinado de pagamento e entrega pode continuar sendo ajustado por fora, como
  no grupo de WhatsApp.

> **No futuro:** quando quiserem, dá para colocar um **link de pagamento externo**
> (Mercado Pago, banco, cartão) no lugar/junto do PIX. A estrutura já está pronta em
> `lib/payments/` (ver seção 8) — é só implementar o provedor lá, sem mexer no resto
> do app.
