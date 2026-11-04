# Kurio — Marketplace de NFTs

Frontend do desafio **NFT Marketplace**, construído com React, TypeScript e a stack
exigida no enunciado. A aplicação roda **inteiramente contra mocks no navegador**
(MSW + transporte Socket.IO compatível): não há blockchain, gateway de pagamento,
banco de dados nem servidor real.

- **Demo publicada:** _(preencher após o deploy)_
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
__mocks.reset()                         // volta ao baseline (equivalente ao mocks:reset)
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
  `@axe-core/playwright` e baseline visual versionado).
- **Lighthouse CI:** 3 execuções por página e perfil, mediana publicada, metas
  Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.
- **CI:** `.github/workflows/ci.yml` roda typecheck, lint, testes, build, E2E e
  Lighthouse a partir de um checkout limpo.

## Deploy

Vercel por padrão, com fallback de SPA em [vercel.json](vercel.json) (`rewrites` para
`index.html`), garantindo acesso direto e refresh em qualquer rota. O build publicado
contém os mocks e o transporte de tempo real. Netlify ou Cloudflare Pages funcionam
com o mesmo `dist` e rewrite equivalente.

## Limitações conhecidas

- Sem chain, gateway ou backend reais: tudo é simulado na camada de rede.
- O transporte de tempo real é uma simulação em navegador (MSW + `socket.io-client`);
  o cliente é importado sob demanda e o motivo está em [ARCHITECTURE.md](ARCHITECTURE.md).
- Desvios de layout medidos e explicados (Home +43 px, Detalhe −175 px, Carrinho
  −94 px, Pagamento −41 px) estão em [docs/TASKS.md](docs/TASKS.md).
- O detalhe do NFT não tem avaliações: o contrato do mock não expõe esse recurso, e a
  UI não simula um bloco que a API não sustenta.
