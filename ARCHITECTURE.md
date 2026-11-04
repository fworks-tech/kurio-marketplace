# Arquitetura

Documento técnico da aplicação implementada: camadas, contratos, política de estado,
mocks, tempo real, design system e decisões registradas. O enunciado do desafio define
o comportamento esperado; este arquivo registra **como** cada requisito foi atendido e
o que ficou de fora, com motivo.

## 1. Camadas

```text
app/              bootstrap, providers, router, guards, realtime, tokens
  ↓
features/<área>   queries, mutations e lógica acoplada à rota
  ↓
shared/services   uma chamada tipada por recurso
shared/realtime   reducers de evento (versionados)
shared/api        contratos, tipos, ApiError, Zod, money, http-client (Axios)
shared/lib        query-client (política + fábrica de chaves), utilitários
  ↓
mocks/            handlers MSW, estado determinístico, cenários, fixtures, socket
```

A dependência nunca sobe: `features` importa `shared`; `shared` importa apenas
contratos; `handlers` importam somente estado; componentes **nunca** importam `mocks`.
Toda resposta fictícia vive em `src/mocks` — não existe caminho alternativo de negócio
dentro de componentes, hooks ou cliente Axios.

## 2. Roteamento

TanStack Router file-based, com rotas tipadas para todas as telas: `/` (catálogo),
`/nfts/$nftId`, `/cart`, `/payment`, `/orders/$orderId`, `/login`, `/signup`,
`/profile`, `/wallets` e a rota de não encontrado.

- **Search params tipados** (`validateSearch` com Zod): busca, filtros, ordenação e
  página vivem na URL, sobrevivem a refresh e navegação por histórico.
- **Guards** (`beforeLoad`) protegem checkout, perfil e carteiras e redirecionam para
  `/login?redirect=…`; o destino de retorno passa por `isInternalPath`, que rejeita
  URLs absolutas e protocolo-relativas (bloqueio de open redirect).
- **Deep links** funcionam em toda rota porque o build publicado serve o fallback de SPA.

## 3. Camada HTTP e contratos

Um único Axios: base `API_BASE_URL`, header de request id, `AbortSignal` por requisição e
timeout. Interceptors fazem apenas trabalho transversal: anexam a sessão e normalizam
qualquer falha em `ApiError` tipado (validação, não autenticado, proibido, não encontrado,
conflito de disponibilidade, transitório). Nenhuma regra de negócio e nenhuma resposta
falsa vivem no cliente.

Envelope de coleção: `{ data, meta { page, limit, total, totalPages }, success, requestId, timestamp }`.
Erro: `{ success: false, error { code, message, fieldErrors?, type }, timestamp, requestId }`.

| Recurso | Endpoint | Observações |
| --- | --- | --- |
| Sessão | `GET /auth/session` | Retorna `null` quando anônimo. |
| Cadastro | `POST /auth/register` | `409` em e-mail/usuário duplicado. |
| Login / logout | `POST /auth/login`, `POST /auth/logout` | Sessão com `expiresAt`. |
| Catálogo | `GET /nfts` | Busca, filtros, ordenação e paginação. |
| Facets | `GET /nfts/facets` | Contagens para os filtros. |
| Detalhe | `GET /nfts/:nftId` | `404` para id inexistente. |
| Favoritos | `GET /favorites`, `POST /favorites/:nftId`, `DELETE /favorites/:nftId` | Toggle otimista. |
| Carrinho | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:nftId`, `DELETE /cart/items/:nftId` | Limite por NFT (`5`); `400` acima disso. |
| Cotação | `POST /cart/quote` | Cupom, disponibilidade, desconto, taxa e total. |
| Pedidos | `POST /orders`, `GET /orders/:orderId`, `GET /orders/:orderId/receipt` | `Idempotency-Key` obrigatório; `404` para pedido de outro usuário. |
| Perfil | `GET /profile`, `PATCH /profile`, `POST /profile/avatar`, `POST /profile/password` | Erros de validação por campo. |
| Carteiras | `GET /wallets`, `POST /wallets`, `PATCH /wallets/:walletId` | Principal e secundária. |
| Simulação | `POST /__simulate/nft-updated`, `POST /__simulate/order-updated` | Mudam o estado e emitem o evento. |

## 4. Estado remoto (TanStack Query)

Política única e documentada:

| Aspecto | Valor | Motivo |
| --- | --- | --- |
| `staleTime` | 30 s | Catálogo é volátil, mas não precisa refetch a cada troca de rota. |
| `gcTime` | 5 min | Voltar para uma tela recente reaproveita o cache. |
| `refetchOnWindowFocus` | desligado | Evita ruído durante a avaliação e nos testes. |
| `refetchOnReconnect` | ligado | Reconciliação após queda de rede. |
| Retry | sem retry em 4xx; máx. 2 em rede/timeout/5xx | Falha de contrato não se resolve repetindo. |
| Mutations | nunca dão retry automático | Idempotência fica explícita na chave enviada. |

Chaves vêm de uma fábrica isolada por **usuário** e por **parâmetros** da consulta, então
não há vazamento de dados entre sessões nem mistura de filtros. Toda query recebe o
`AbortSignal` do Query e respostas obsoletas são descartadas.

**Mutação otimista** (favoritos): cancela queries em voo → snapshot → aplica → rollback em
erro → invalida ao finalizar. `clearSessionCaches()` limpa o cache no logout e na troca de
usuário.

## 5. Sessão e isolamento

A sessão vive no estado do mock, não em header injetado. Ela carrega `expiresAt`; vencida,
as leituras tratam o usuário como anônimo e as rotas protegidas recebem `SESSION_EXPIRED`,
com redirecionamento único para o login preservando o destino e o contexto interrompido.

Carrinho, favoritos e carteiras são indexados por `userId` (com chave anônima de fallback)
e todo handler protegido exige sessão antes de responder. Pedidos guardam o comprador:
`GET /orders/:id` devolve `404` para id de outro usuário, sem revelar existência.

## 6. Carrinho

O carrinho é uma lista de `{ nftId, price, quantity, total, nft }`, por usuário.

- **Visitante:** `src/features/cart/guest-cart.ts` guarda o carrinho em `localStorage`
  (`kurio:guest-cart`), então o refresh não perde itens. No login, `useMergeGuestCart`
  reenvia cada item por `POST /cart/items`, limpa a cópia local e invalida o carrinho da
  conta — com guarda por sessão para não duplicar em refresh.
- **Limites:** cada linha é limitada a 5 unidades, validado também no HTTP (`400`).
- **Preços:** atualizados a partir do catálogo a cada leitura; eventos de tempo real
  sinalizam divergência com a cotação em tela.
- **Após a compra:** apenas as quantidades efetivamente compradas saem do carrinho.

## 7. Dinheiro e cotação

Valores em ETH trafegam como **strings decimais** e são calculados em micro-unidades
inteiras (`shared/api/money`), evitando deriva de ponto flutuante em somas, multiplicação
por quantidade, descontos e taxas. Um valor nunca arredonda diferente entre carrinho,
cotação e pedido.

`POST /cart/quote` devolve `createdAt`/`expiresAt` (TTL de 15 minutos). Revalidar uma
cotação expirada retorna `410 QUOTE_EXPIRED`. O id da cotação é derivado do conteúdo, portanto
determinístico. Quando preço, disponibilidade, cupom ou taxa mudam, `diffQuote` +
`describeQuoteChanges` explicam a diferença e o usuário precisa reconhecer a mudança antes
de enviar o pedido.

## 8. Pedidos e idempotência

`POST /api/orders` exige `Idempotency-Key` de 8 a 128 caracteres (`[A-Za-z0-9_-]`).

- Mesma chave com a mesma intenção (rede, cupom, itens) **reproduz** o pedido existente:
  um retry após `504` simulado recupera o pedido em vez de comprar duas vezes.
- Mesma chave com conteúdo diferente devolve `409 IDEMPOTENCY_CONFLICT`.
- O status caminha `pending → confirmed` ou `pending → rejected`. A transição chega por
  REST (recuperação após refresh) ou por evento `order.updated`.
- A tela de confirmação mostra **recusa** com motivo, sem link de transação, e oferece
  "Tentar novamente" e "Revisar carrinho".
- O recibo é um snapshot do pedido: mudanças posteriores no catálogo não alteram valores.

## 9. Tempo real

`src/app/realtime.ts` é o único gerenciador de socket: conecta após o bootstrap dos mocks,
assina `nft.updated` e `order.updated` e dobra cada evento no cache **somente quando ele
avança `version`** — duplicados, antigos e fora de ordem não regridem estado nem reaplicam
efeitos. Após reconexão, invalida as chaves `nfts` e `orders` para o REST revalidar a
verdade. Logout desconecta o socket e libera todos os listeners.

Eventos:

| Evento | Payload | Escopo |
| --- | --- | --- |
| `nft.updated` | `{ nftId, version, priceEth, availability, updatedAt }` | Broadcast |
| `order.updated` | `{ orderId, version, status, transactionId?, explorerUrl?, updatedAt }` | Apenas a sessão dona |

O cliente é `socket.io-client` de verdade; as mudanças de mock passam pelos handlers, que
respondem o REST **e** emitem o evento — componentes nunca chamam setters nem o cache para
fingir um evento.

**Transporte e a ordem de inicialização:** a interceptação WebSocket vem do
`@mswjs/interceptors` que acompanha o `msw` 3 (o build de navegador do `msw` 2 não trazia
esse interceptor). O engine.io captura `globalThis.WebSocket` quando seu módulo é avaliado,
portanto o `socket.io-client` é importado **sob demanda**, depois que o worker está ativo
(`loadSocketIo()` em `shared/socket/client.ts`). Um import estático capturaria o WebSocket
nativo e nenhum evento chegaria à UI. Pelo mesmo motivo, o login reassina o socket com o
`userId` da sessão: eventos de pedido são escopados por dono.

Verificado em desenvolvimento e no build publicado: disparar
`POST /api/__simulate/nft-updated` altera o preço na grade sem refetch REST.

## 10. Camada de mocks

- **REST:** handlers MSW com validação de entrada, códigos de erro do contrato e estado
  determinístico em memória, persistido em `localStorage` para sustentar refresh.
- **Fixtures:** variedade suficiente para filtros e paginação, dois usuários (`alice`,
  `bob`), coleção vazia, esgotado e pedido recusado.
- **Cenários:** nomes reprodutíveis (`slow`, `timeout`, `network-failure`, `http-4xx`,
  `http-5xx`, `session-expired`, `payment-rejected`, `invalid-coupon`, `expired-coupon`,
  `price-changed`, `sold-out`, `idempotency-conflict`, `out-of-order`), ativados por
  cabeçalho, query string ou `window.__mocks`, com prioridade nessa ordem.
- **Reset:** `__mocks.reset()` restaura fixtures, cotações, pedidos e chaves de
  idempotência, além do cenário ativo.
- **Mesmos handlers para dev, demo e testes:** o build `--mode mock` empacota o worker,
  então a demo publicada e o ambiente local exercitam o mesmo contrato.

## 11. Design system e acessibilidade

Tailwind v4 com **tokens semânticos** em `src/app/app.css` como fonte única da verdade
(paleta, aliases shadcn, raios, elevação, movimento e escala tipográfica). Componentes
consomem tokens (`bg-surface-card`, `text-price`, `text-title`), nunca hex cru.

- **Tema:** dark fixo, com `class="dark"` no `<html>` e `@custom-variant` — determinístico
  para as baselines visuais e para o Lighthouse, independente do sistema do avaliador.
- **Tipografia:** Roboto Mono servida localmente via `@fontsource-variable/roboto-mono`
  (sem requisição externa, com `font-display`).
- **Foco:** anel global `:focus-visible` de 2 px; `prefers-reduced-motion` neutraliza
  animações e o shimmer.
- **Feedback:** `Skeleton` que preserva dimensões e região `aria-live` para mutações e
  eventos de tempo real.
- **Contraste:** onde o par do Figma é baixo, o token é usado junto de um segundo
  indicador (nunca cor como única informação).
- **Auditoria:** `@axe-core/playwright` roda nas rotas principais do fluxo; a meta
  Lighthouse de acessibilidade é ≥ 95.

## 12. Decisões registradas

| Tema | Decisão | Motivo |
| --- | --- | --- |
| Build | Vite + `--mode mock` | Paridade dev/prod e demo publicada sem backend. |
| Formulários | react-hook-form + Zod | Performance não controlada e um schema por formulário. |
| Validação de runtime | Zod em toda borda (API, search params, forms) | Payload inválido falha na borda, não no componente. |
| Deploy | Vercel (https://kurio-marketplace-theta.vercel.app) com rewrite de SPA | Acesso direto e refresh em qualquer rota. |
| Cenários | env + query + `window.__mocks` | Reprodutível pela URL, persistente e ajustável em execução. |
| `mocks:reset` | `__mocks.reset()` na aplicação | O estado vive no `localStorage` do navegador, não em um processo CLI. |
| Copy | Português, conforme o enunciado | Os textos em inglês do Figma são placeholder. |
| Catálogo | 9 itens por página | Fecha a seção do frame em uma grade 3×3. |
| Revisão de cotação | Reconhecimento explícito | O enunciado exige nova confirmação quando o total muda. |
| Pedido | Uma chave de idempotência por tentativa | Retry e timeout recuperam o mesmo pedido. |
| Avaliações no detalhe | Não renderizadas | Sem endpoint de reviews no contrato; renderizar seria UI falsa. |
| Campos de perfil no checkout | Estado de UI | `POST /orders` recebe rede e chave; persistir perfil exige mudança de contrato. |
| Frames mobile | Layout responsivo, mesmas rotas | Regra do projeto: muda o layout por breakpoint, não a rota. |
| Mocking de tempo real | `msw` 3 + `socket.io-client` carregado sob demanda | O interceptor de WebSocket só existe no `msw` 3; o import estático captura o WebSocket nativo. |
| Escopo do socket | Reassina no login com o id da sessão | `order.updated` é privado do dono do pedido. |

## 13. Paridade com o Figma

Medições com Playwright em 1440 px (e 414 px para a passada responsiva).

| Tela | Rota | Frame | Construído | Δ | Observação |
| --- | --- | ---: | ---: | ---: | --- |
| Home | `/` | 3668 | 3711 | +43 | Section tops dentro de ~10 px; card, preço e paginação seguem o frame. |
| Detalhe do NFT | `/nfts/$nftId` | 2246 | 2071 | −175 | Sem avaliações (contrato) e descrição mais curta no fixture. |
| Carrinho | `/cart` | 1754 | 1660 | −94 | Tabela de 5 colunas, linhas de 70 px, resumo de 405 px. |
| Pagamento | `/payment` | 1657 | 1616 | −41 | Duas sub-colunas de 370 px, "Carteira e rede", CTA 405×45. |
| Confirmação | `/orders/$orderId` | — | — | — | Depende de pedido criado; estados pendente, confirmado e recusado implementados. |
| Login / Cadastro | `/login`, `/signup` | modal | modal | — | Shell de 500 px, campos 340×40, CTA 340×45. |
| Perfil | `/profile` | 1080 | viewport | — | Sidebar 310, gutter 28, formulário 862. |
| Carteiras | `/wallets` | 1080 | viewport | — | Mesmo shell do perfil. |
| Mobile (6 frames) | mesmas rotas | 414×… | — | — | Sem overflow horizontal a 390 e 414 px; auditoria pixel a pixel pendente. |

**Política de desvio:** uma tela só desvia com motivo declarado (contrato ausente, asset
ausente, fonte de copy). O motivo fica aqui e em [docs/TASKS.md](docs/TASKS.md). O que não
está igual nem justificado é bug.

Não reproduzido de propósito: avaliações no detalhe (sem endpoint), logos de carteira e
mídia real dos NFTs (placeholders), e o chrome de mockup do Figma (cantos de 40 px e
margens de artboard).

## 14. Testes e CI

- **Vitest:** contrato REST, estado do mock, fixtures, serviços, socket, reducers de
  tempo real, precisão monetária e casos de borda (cotação expirada, conflito de
  idempotência, chave malformada, propriedade de pedido, hash de senha, limite de
  quantidade).
- **Playwright:** smoke (navegação, deep link, guard de rota, foco por teclado),
  acessibilidade com `@axe-core/playwright` e regressão visual preparada para baselines
  por plataforma (o teste é ignorado enquanto não houver baseline commitada, para não
  gerar falso negativo em CI), com trace e screenshot em falha e movimento desligado.
- **Lighthouse CI:** 3 execuções por página e perfil, mediana publicada, com LCP, CLS e
  TBT, gated em 90 / 95 / 95 / 90. Última execução contra a URL publicada
  (`npm run lighthouse:prod`): Performance 99–100, Acessibilidade 97–100, Boas práticas
  96, SEO 100, LCP 0,6–0,7 s, CLS 0; relatórios em `docs/lighthouse`.
- **Pipeline:** `npm ci` instala pelo lockfile; typecheck, lint, testes, build e E2E rodam
  na mesma ordem em qualquer runner, com relatório HTML e traces das falhas do Playwright.

## 15. Limitações conhecidas

- **Sem backend real.** Todo o estado é simulado; nada substitui um servidor de produção.
- **Desvios de layout** listados na seção 13 vêm de conteúdo e ritmo de seção, não de
  layout quebrado.
- **Campos de perfil no checkout** não viajam em `POST /orders`.
- **"Carteira e rede"** é seletor e simulação de conexão: não altera a cotação, que segue
  a rede escolhida no topo do formulário.
