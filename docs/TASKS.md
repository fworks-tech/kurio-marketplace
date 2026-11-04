# Status de implementação

Consolidação do que está entregue por tela e por fluxo, com os desvios medidos e o que
fica no backlog. Medições com Playwright em viewport de 1440 px; a passada responsiva usa
390 e 414 px.

## Telas

| Tela | Rota | Estado | Observações |
| --- | --- | --- | --- |
| Início | `/` | Completa (+43 px) | Hero, catálogo, busca, filtros, ordenação, paginação e blocos editoriais; card 258×300 com as três ações no hover. |
| Detalhe do NFT | `/nfts/$nftId` | Completa (−175 px) | Galeria com rail de 100 px, edição, quantidade limitada, favorito e compra; sem bloco de avaliações. |
| Carrinho | `/cart` | Completa (−94 px) | Tabela de 5 colunas, linhas de 70 px, cupom, remoção e resumo de 405 px. |
| Pagamento | `/payment` | Completa (−41 px) | Dados do colecionador, duas sub-colunas de 370 px, carteira e rede, CTA 405×45, revisão de cotação. |
| Confirmação | `/orders/$orderId` | Completa | Estados pendente, confirmado e recusado; recibo como snapshot e ações de recuperação na recusa. |
| Login | `/login` | Completa | Modal de 500 px, campos 340×40, retorno ao fluxo interrompido. |
| Cadastro | `/signup` | Completa | Mesmo shell do login; conflito de e-mail e usuário tratado. |
| Perfil do colecionador | `/profile` | Completa | Sidebar 310, gutter 28, formulário 862; nome, e-mail, ENS e avatar. |
| Carteiras | `/wallets` | Completa | Mesmo shell; carteira principal e secundária, criação e edição. |
| Mobile (6 frames) | mesmas rotas | Responsiva | Sem overflow horizontal a 390 e 414 px; auditoria pixel a pixel pendente. |

## Fluxos

| Fluxo | Entregue | Evidência |
| --- | --- | --- |
| Autenticação | Cadastro, login, logout e expiração com retomada de contexto | Guarda de rota, `clearSessionCaches()`, testes de sessão |
| Catálogo | Busca, filtros combináveis, ordenação e paginação na URL | Testes de paginação e de search params |
| Detalhe | Acesso direto, NFT inexistente, edição indisponível e limite de quantidade | Testes de contrato e de estado |
| Favoritos | Toggle otimista com rollback e persistência por usuário | Mutação otimista em `features/favorites` |
| Carrinho | Adicionar, alterar, remover, cupom, persistência e merge do visitante | `guest-cart.ts`, `useMergeGuestCart`, testes de quantidade |
| Pagamento | Validação, revisão de cotação, idempotência e simulação de carteira | `diffQuote`, `use-wallet-connection` |
| Pedido | Criação idempotente, confirmação por evento e recusa com recuperação | `__simulate/order-updated` |
| Tempo real | `nft.updated` e `order.updated` com guarda de versão e reconciliação | `app/realtime.ts`, reducers, 5 testes de socket verdes |

## Tempo real: o que estava quebrado e como foi resolvido

| Sintoma | Causa | Correção |
| --- | --- | --- |
| Nenhum evento chegava à UI | Build de navegador do `msw` 2 não tem interceptor de WebSocket | Upgrade para `msw` 3 (`@mswjs/interceptors` 0.45) |
| Interceptor ativo, evento ainda perdido | O engine.io captura o `WebSocket` global no import do módulo, antes do worker iniciar | Import sob demanda do `socket.io-client` em `loadSocketIo()` |
| Eventos de pedido não chegavam após login | Socket assinava só no boot, com `userId` nulo | Reassina em `storeSession()` com o id da sessão |

Comprovação: `POST /api/__simulate/nft-updated` altera o preço na grade sem refetch REST,
tanto em `npm run dev:mocks` quanto no `preview` do build de produção.

## Cinco itens prioritários

| Item | Estado | Como foi resolvido |
| --- | --- | --- |
| Acessibilidade | Fechado | `aria-controls` válido nas abas do catálogo, nome acessível nos cards, axe sem violações em `/`, `/nfts/:id`, `/login`, `/signup`. |
| Overflow mobile | Fechado | `scrollWidth === clientWidth` a 390 px nas quatro rotas acima; abas e ordenação quebram linha. |
| Carrinho do visitante | Fechado | Carrinho em `localStorage` com merge para a conta no login e guarda por sessão. |
| Simulação de carteira | Fechado | Conectar, aprovar, recusar, desconectar e tentar de novo; endereço preenche o campo. |
| Pedido recusado | Fechado | Copy própria, motivo, sem link de transação, "Tentar novamente" e "Revisar carrinho". |

## Backlog

| Item | Por que ainda não está pronto |
| --- | --- |
| Auditoria pixel a pixel do mobile | As seis telas mobile têm verificação de overflow, mas não comparação frame a frame. |
| Logos de carteira e mídia real dos NFTs | Assets não fornecidos; hoje são placeholders de gradiente. |
| Avaliações no detalhe | Sem endpoint de reviews no contrato; a seção não é renderizada de propósito. |
| Campos de perfil no checkout | Dependem de mudança em `POST /orders` para viajar no pedido. |
| Cobertura de UI de cupom | O contrato de cupom tem teste; o fluxo de digitação na tela não. |

## Verificação na URL publicada

Auditoria feita em https://kurio-marketplace-theta.vercel.app, com o build de produção
(mocks e tempo real ativos).

| Verificação | Resultado |
| --- | --- |
| Rotas com acesso direto | `/`, `/nfts/nft-001`, `/profile`, `/wallets`, `/payment` respondem 200 e o refresh mantém a rota. |
| Guarda de sessão | `/profile` e `/wallets` sem sessão redirecionam para `/login?redirect=…`; após o login a tela abre com o conteúdo. |
| Tempo real | `POST /api/__simulate/nft-updated` levou o preço de 2,5 para 9,99 ETH no detalhe, sem refetch REST. |
| Perfil e carteiras | `h1` "Perfil do colecionador" (9 campos) e "Carteira principal" renderizados com dados da sessão. |
| Lighthouse (mediana de 3 por página) | `/`: 100 / 97 / 96 / 100; `/nfts/nft-001`: 99 / 100 / 96 / 100; `/login`: 99 / 100 / 96 / 100 (performance / acessibilidade / boas práticas / SEO). LCP 0,6–0,7 s, CLS 0, TBT ≤ 8 ms. Relatórios em `docs/lighthouse`. |

Boas práticas fica em 96 por três pontos conhecidos: o `401` da checagem de sessão
anônima (resposta correta do contrato, registrada no console do navegador), o alvo de
toque de 16 px dos checkboxes de filtro e o `llms.txt` sem `H1` e sem links.
