# Kurio — Marketplace de NFTs

Frontend do desafio **NFT Marketplace**, construído com React, TypeScript e a stack
exigida no enunciado. A aplicação roda **inteiramente contra mocks no navegador**
(MSW + transporte Socket.IO compatível): não há blockchain, gateway de pagamento,
banco de dados nem servidor real.

- **Demo publicada:** [https://kurio-marketplace-theta.vercel.app/](https://kurio-marketplace-theta.vercel.app/)
- **Arquitetura e decisões:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Status por tela e backlog:** [docs/TASKS.md](docs/TASKS.md)

## Stack

| Responsabilidade | Tecnologia |
| --- | --- |
| Interface | React 19 + TypeScript |
| Build | Vite |
| Roteamento | TanStack Router (file-based, search params tipados) |
| Estado remoto | TanStack Query |
| Cliente HTTP | Axios |
| Tempo real | Socket.IO (`socket.io-client`) |
| Estilização | Tailwind CSS v4 + tokens semânticos |
| Componentes | shadcn/ui (Radix) |
| Mocking | MSW 3 (REST + WebSocket) |
| Testes | Vitest (unidade e contrato) + Playwright (E2E, a11y e regressão visual) |
### Layout mobile

As seis telas mobile seguem as medidas dos frames `Mobile / *` (414x896): linha de
busca de 45 px com campo de 313 px e filtro de 45x45, tab bar de 95 px com ação
flutuante de 65 px sobreposta em 31 px, barra de filtros em drawer, campos de 50 px
com raio 10 e CTAs de 60 px (raio 40 no carrinho e no pagamento). Os gutters são de
24 px no conteúdo e 28 px nas telas de autenticação.

A tab bar aparece apenas nas telas que não têm outra navegação; detalhe, carrinho,
pagamento, login e cadastro ficam sem ela, como nos frames, o que também evita
sobreposição com o CTA fixo do pagamento. `e2e/mobile-layout.spec.ts` mede essas
métricas, valida a busca no mobile e garante ausência de rolagem horizontal.

| Auditoria | Lighthouse CI |

## Requisitos

- Node **22.12+** (fixado em `.nvmrc`): `nvm use`. O `msw` 3 exige essa versão.
- Chromium do Playwright, apenas para os testes E2E:
  `npx playwright install --with-deps chromium`.
- Chrome instalado, apenas para `npm run lighthouse`.

## Como rodar

```bash
npm ci
npm run dev:mocks      # http://localhost:5173 com os mocks ativos
```

O build de demonstração também embute os mocks (`--mode mock` + `public/mockServiceWorker.js`),
então o site publicado funciona sem backend.

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (mocks ligados por padrão). |
| `npm run dev:mocks` | Força `--mode mock`. |
| `npm run build` | Typecheck + build de produção em modo mock. |
| `npm run preview` | Serve o `dist` gerado. |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`). |
| `npm run lint` | ESLint (TypeScript, imports não usados). |
| `npm run test` | Vitest: unidade, contrato REST, estado do mock e socket. |
| `npm run test:e2e` | Playwright (Chromium; viewports 390 / 768 / 1440). |
| `npm run lighthouse` | Build + Lighthouse CI (3 execuções por página, mediana). |

## Variáveis de ambiente

Injetadas pelo Vite via `define` (o código testado não lê `import.meta.env`):

| Variável | Padrão | Para que serve |
| --- | --- | --- |
| `MOCK_MODE` | `'true'` em `--mode mock`, senão `'false'` | Liga/desliga o MSW no bootstrap. |
| `API_BASE_URL` | `/api` | Base do Axios. |

Copie `.env.example` para `.env` se precisar apontar para outro host.

## Credenciais fictícias

| E-mail | Senha |
| --- | --- |
| `alice@example.com` | `password123` |
| `bob@example.com` | `password123` |

As senhas existem apenas como hash determinístico no mock e nunca aparecem em resposta.
Cupons: `WELCOME10` (10%), `FLAT5` (0,5 fixo) e `EXPIRED20` (expirado).

## Cenários de mock e reset

Cenários são nomes reproduzíveis de falha e latência. A precedência é: cabeçalho →
query string → `window.__mocks`.

1. **Cabeçalho por requisição:** `x-mock-scenario: <nome>`.
2. **Query string:** `?mockScenario=<nome>` (persiste em `localStorage` e sobrevive ao refresh).
3. **Em execução**, com mocks ativos:

```js
__mocks.setScenario('payment-rejected') // ativa um cenário
__mocks.scenario()                      // nome ativo
__mocks.reset()                         // volta ao baseline
__mocks.describe()                      // inspeciona o estado do mock
```

Cenários disponíveis: `slow`, `timeout`, `network-failure`, `http-400`, `http-401`,
`http-403`, `http-404`, `http-409`, `http-500`, `session-expired`, `payment-rejected`,
`invalid-coupon`, `expired-coupon`, `price-changed`, `sold-out`,
`idempotency-conflict`, `out-of-order`.

`__mocks.reset()` restaura fixtures, limpa cotações, pedidos e chaves de idempotência,
deixando o estado reprodutível para uma nova avaliação ou teste.

## Reproduzir os fluxos de falha

| Fluxo | Como reproduzir |
| --- | --- |
| Pagamento recusado | `?mockScenario=payment-rejected` e finalize uma compra. |
| Cupom inválido/expirado | Aplique `EXPIRED20` ou use `?mockScenario=invalid-coupon`. |
| Preço alterado durante a compra | `POST /api/__simulate/nft-updated {"nftId":"nft-001","priceEth":"9.99"}` |
| Edição esgotada | `POST /api/__simulate/nft-updated {"nftId":"nft-001","availability":0}` |
| Pedido confirmado/recusado por evento | `POST /api/__simulate/order-updated {"orderId":"…","status":"rejected"}` |
| Timeout com retomada idempotente | `?mockScenario=timeout` e reenvie o mesmo `Idempotency-Key`. |
| Sessão expirada no checkout | `?mockScenario=session-expired` durante o fluxo de pagamento. |

Os endpoints `__simulate` atualizam o estado do mock e emitem o evento correspondente
pelo socket — a UI reage como reagiria a um evento real.

## Roteiro de auditoria end-to-end

Sequência única que percorre todas as páginas e estados da aplicação, na ordem em que um
colecionador passaria por elas. Cada etapa indica a tela correspondente do Figma, o que
deve aparecer e o que comparar. São cerca de 10 minutos de ponta a ponta.

**Preparação**

1. `npm ci && npm run build && npm run preview` (ou abra
   https://kurio-marketplace-theta.vercel.app).
2. Use janela de **1440 px** para os frames desktop e **414 px** para os mobile.
3. Antes de começar, no console do navegador: `__mocks.reset()`.

### 1. Início (`/`) · `Desktop / Início 1440` e `Mobile / Início 414`

- Abas de categoria com contagem (`Arte digital (40)`, `Fotografia (14)`, ...).
- Filtros: aplicar categoria e faixa de preço, confirmar que a grade e a URL acompanham.
- Busca no cabeçalho, com resultado e com termo sem correspondência.
- Ordenação e paginação ao pé da grade.
- Card do produto: imagem, nome, preço em ETH, estado (edição aberta ou esgotada).
- Cabeçalho: logo, Início/Mercado/Criadores/Aprenda, busca, carrinho com contador, Entrar.
- Rodapé: colunas de links, carteiras aceitas, ícones sociais e contato.
- Mobile: barra de abas inferior, hero e grade em coluna única.

### 2. Detalhes do NFT (`/nfts/nft-002`) · `Desktop / Detalhes do NFT 1440`

- Breadcrumb `Início / Mercado`, título, preço em `#E89B55`, estrelas e pílulas de
  edição com o estado (ABERTA ou ESGOTADA).
- Seletor de quantidade e ações `COMPRAR` e `Favoritar`.
- Abas `Detalhes do NFT` e `Avaliações de colecionadores (N)`.
- Seção de relacionados com indicadores de navegação.
- Mobile: folha de detalhes e barra de compra fixa.

### 3. Carrinho (`/cart`) · `Desktop / Carrinho de NFTs 1440`

- Sem sessão a página pede login no próprio local; os itens ficam no carrinho de
  convidado e continuam lá depois de entrar.
- Com sessão: itens com imagem, quantidade editável e remoção.
- Cupons: `WELCOME10` (10%), `FLAT5` (0,5 fixo) e `EXPIRED20` (erro visível na tela).
- Resumo com subtotal, desconto, taxa estimada e total.
- `Continuar explorando` volta ao mercado e `Conectar e finalizar` segue para o pagamento.

### 4. Login e cadastro (`/login`, `/signup`) · `Desktop / Login 1440`, `Desktop / Cadastro 1440` e modais

- Modal aberto pelo cabeçalho e páginas completas com o mesmo formulário.
- Credenciais fictícias: `alice@example.com` e `password123`.
- Validação: campos vazios e credenciais inválidas mostram mensagem por campo.
- Rota protegida: `/profile` sem sessão redireciona para `/login?redirect=/profile`.

### 5. Pagamento (`/payment`) · `Desktop / Pagamento 1440`

- Perfil do colecionador já preenchido com a conta autenticada (nome de exibição, usuário,
  e-mail e nome ENS).
- Endereço da carteira com a carteira principal salva pré-selecionada, com opção de
  digitar outro endereço.
- Rede (Ethereum, Polygon, Base) e tipo de carteira (MetaMask, Coinbase, WalletConnect).
- Confirmação exige os termos marcados e avisa quando a cotação muda entre a abertura e o
  envio.
- `Confirmar compra` cria o pedido e navega para a confirmação.
- Mobile: resumo colapsado em `Mobile / Pagamento 414`.

### 6. Confirmação do Pedido (`/orders/:id`) · `Desktop / Confirmação de Pedido 1440`

- Título de status (`Compra realizada!`, `Pedido em processamento`, `Pedido recusado`) e selo.
- Itens comprados com imagem, quantidade e preço; resumo com taxa de rede e total.
- Identificador do pedido, comprador e link do explorer quando há transação.
- Pedido inexistente mostra o estado de erro com `Tentar novamente`.
- A tela reage ao evento de liquidação sem recarregar. Para conferir, envie o evento
  com o pedido aberto:

```js
await fetch('/api/__simulate/order-updated', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ orderId: 'SEU_PEDIDO', status: 'confirmed' })
})
```

O título vira `Compra realizada!` e o selo passa a confirmado.

### 7. Perfil do colecionador (`/profile`) · `Desktop / Perfil do Colecionador 1440`

- Menu lateral `Meu perfil`: Dados do perfil, Carteiras, Atividade, Lista de interesse,
  Ofertas, Arquivos baixados, Suporte e Sair.
- Campos: nome de exibição, usuário, e-mail, ENS com sufixo `.eth`, apelido da carteira e
  avatar (`Alterar` e `Remover`).
- Alteração de senha com validação de senha atual e confirmação.
- `Salvar` persiste os dados e confirma por toast.

### 8. Carteiras (`/wallets`) · `Desktop / Carteiras 1440`

- Carteira principal com os campos do protótipo: nome de exibição, apelido da carteira,
  rede, nome do perfil, endereço, ENS ou carteira secundária, tipo de carteira, código de
  indicação, e-mail e nome ENS.
- `Salvar carteira` grava e reflete a carteira no pagamento.
- Carteira secundária: `Igual à carteira principal` espelha os dados da principal.

### 9. Acessibilidade e design system

- Rotas de apoio em desenvolvimento: `/design-system` e `/components`.
- Navegação por teclado com foco visível, modais com foco preso e `Esc` fechando.
- Um `<h1>` por rota e landmark `main` em todas as páginas.
- Verificação automatizada: `npm run test:e2e` (inclui `@axe-core/playwright`).

### Checklist rápido

| Etapa | Rota | Frame de referência |
| --- | --- | --- |
| Início | `/` | `Desktop / Início 1440`, `Mobile / Início 414` |
| Detalhes | `/nfts/:id` | `Desktop / Detalhes do NFT 1440`, `Mobile / Detalhes do NFT 414` |
| Carrinho | `/cart` | `Desktop / Carrinho de NFTs 1440`, `Mobile / Carrinho de NFTs 414` |
| Login | `/login` | `Desktop / Login 1440`, `Mobile / Login 414` |
| Cadastro | `/signup` | `Desktop / Cadastro 1440`, `Mobile / Cadastro 414` |
| Pagamento | `/payment` | `Desktop / Pagamento 1440`, `Mobile / Pagamento 414` |
| Confirmação | `/orders/:id` | `Desktop / Confirmação de Pedido 1440` |
| Perfil | `/profile` | `Desktop / Perfil do Colecionador 1440` |
| Carteiras | `/wallets` | `Desktop / Carteiras 1440` |

## Estrutura

```text
src/
  app/        bootstrap, router, guards, realtime, tokens (app.css)
  features/   session, catalog, detail, cart, payment, auth, account, favorites
  shared/     api (contratos), services, realtime, socket, lib, ui
  components/ primitivas shadcn/ui restilizadas por token
  mocks/      handlers, estado, cenários, fixtures, socket, ativação
e2e/          smoke, acessibilidade e regressão visual (Playwright)
```

Regra de dependência: `features` → `shared` → contratos; nenhum componente importa
`mocks` diretamente. Detalhes em [ARCHITECTURE.md](ARCHITECTURE.md).

## Qualidade

- **Typecheck:** um único `tsconfig.json` cobre `src` e `e2e`.
- **Lint:** ESLint com TypeScript, `unused-imports` e `no-console` como aviso.
- **Testes:** Vitest (unidade, contrato REST, estado, socket) e Playwright (smoke,
  `@axe-core/playwright` e regressão visual pronta para baselines por plataforma).
- **Lighthouse CI:** 3 execuções por página e perfil, mediana publicada, metas
  Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.
- **Lighthouse na URL publicada** (`npm run lighthouse:prod`, mediana de 3 execuções por
  página, preset desktop): Performance 99–100, Acessibilidade 97–100, Boas práticas 96,
  SEO 100; LCP 0,6–0,7 s, CLS 0 e TBT ≤ 8 ms. Relatórios em
  [docs/lighthouse](docs/lighthouse).
- **Pipeline:** a partir de um checkout limpo, `npm ci` → `npm run typecheck` →
  `npm run lint` → `npm test` → `npm run build` → `npm run test:e2e`; qualquer runner
  executa a mesma sequência.

## Deploy

Publicado em **https://kurio-marketplace-theta.vercel.app** (Vercel, build com mocks e
tempo real ativos). Vercel por padrão, com fallback de SPA em [vercel.json](vercel.json) (`rewrites` para
`index.html`), garantindo acesso direto e refresh em qualquer rota. O build publicado
contém os mocks e o transporte de tempo real. Netlify ou Cloudflare Pages funcionam
com o mesmo `dist` e rewrite equivalente.

## Limitações conhecidas

- Sem chain, gateway ou backend reais: tudo é simulado na camada de rede.
- O transporte de tempo real é uma simulação em navegador (MSW + `socket.io-client`);
  o cliente é importado sob demanda e o motivo está em [ARCHITECTURE.md](ARCHITECTURE.md).
- Desvios de layout medidos e explicados (Home +43 px, Detalhe −175 px, Carrinho
  −94 px, Pagamento −41 px) estão em [docs/TASKS.md](docs/TASKS.md).
- As avaliações do detalhe do NFT vêm do contrato do mock; não há moderação nem envio de
  novas avaliações pela interface.
