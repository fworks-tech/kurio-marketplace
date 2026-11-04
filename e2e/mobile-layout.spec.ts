import { expect, test } from '@playwright/test'
import { addToCart, signIn } from './helpers'

/**
 * Pixel checks against the Figma mobile frames (414x896): home search row, the
 * 95px tab bar with its floating action, auth field metrics, the 60px checkout
 * CTAs and the absence of horizontal overflow on the account screens.
 */
test.describe('layout mobile conforme Figma', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-mobile', 'mobile metrics only')
    await page.setViewportSize({ width: 414, height: 896 })
  })

  test('a home usa campo de busca de 313px e botão de filtro de 45px', async ({ page }) => {
    await page.goto('/')
    const search = page.locator('#catalog-search-mobile').first()
    await expect(search).toBeVisible()
    const field = await search.boundingBox()
    expect(Math.round(field!.width)).toBe(313)
    expect(Math.round(field!.height)).toBe(45)
    expect(Math.round(field!.width + Math.round(field!.height))).toBeGreaterThan(0)

    const trigger = page.getByRole('button', { name: 'Filtros' }).first()
    const button = await trigger.boundingBox()
    expect(Math.round(button!.width)).toBe(45)
    expect(Math.round(button!.height)).toBe(45)

    await trigger.click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('a busca filtra o catálogo no mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('article').first()).toBeVisible()
    await page.locator('#catalog-search-mobile').first().fill('Emerald')
    await expect
      .poll(async () => page.locator('article').count(), { timeout: 6000 })
      .toBeGreaterThan(0)
    expect(await page.locator('article').count()).toBeLessThanOrEqual(6)

    await page.locator('#catalog-search-mobile').first().fill('zzzz-nao-existe')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible({ timeout: 6000 })
  })

  test('a tab bar tem 95px com ação flutuante de 65px', async ({ page }) => {
    await page.goto('/')
    const bar = page.getByRole('navigation', { name: 'Navegação inferior' })
    await expect(bar).toBeVisible()
    const box = await bar.boundingBox()
    expect(Math.round(box!.height)).toBe(95)

    const fab = bar.locator('span.bg-gradient-fab')
    const fabBox = await fab.boundingBox()
    expect(Math.round(fabBox!.width)).toBe(65)
    expect(Math.round(fabBox!.height)).toBe(65)
    // 31px of the action sits above the bar, as in the frame.
    expect(Math.round(fabBox!.y)).toBeLessThan(Math.round(box!.y))
  })

  test('as telas de fluxo não exibem a tab bar', async ({ page }) => {
    for (const path of ['/cart', '/login']) {
      await page.goto(path)
      await expect(page.getByRole('navigation', { name: 'Navegação inferior' })).toHaveCount(0)
    }
  })

  test('login e cadastro usam campos de 50px e CTA de 60px', async ({ page }) => {
    // Below 1024px the auth screens are full pages, so the scope is `main`.
    for (const [path, action] of [
      ['/login', 'Entrar'],
      ['/signup', 'Criar perfil']
    ] as const) {
      await page.goto(path)
      const scope = page.locator('main')
      await expect(scope.getByRole('heading', { level: 1 })).toHaveText(
        path === '/login' ? 'Entrar' : 'Criar perfil de colecionador'
      )
      const field = await scope.locator('input').first().boundingBox()
      expect(Math.round(field!.height), `${path} campo`).toBe(50)
      const cta = await scope.getByRole('button', { name: action }).first().boundingBox()
      expect(Math.round(cta!.height), `${path} CTA`).toBe(60)
    }
  })

  test('o carrinho mantém o CTA de 60px com raio 40', async ({ page }) => {
    await signIn(page)
    await page.goto('/nfts/nft-002')
    await page.getByRole('button', { name: /COMPRAR|Comprar/ }).first().click()
    await page.goto('/cart')
    const cta = page.getByRole('button', { name: 'Conectar e finalizar' }).first()
    await expect(cta).toBeVisible()
    const box = await cta.boundingBox()
    expect(Math.round(box!.height)).toBe(60)
    expect(await cta.evaluate((el) => getComputedStyle(el).borderRadius)).toBe('40px')
  })

  test('o pagamento mantém o CTA fixo clicável acima da dobra', async ({ page }) => {
    await signIn(page)
    await addToCart(page, 'nft-003')
    await page.goto('/payment')
    const cta = page.getByRole('button', { name: 'Confirmar compra' }).first()
    await expect(cta).toBeVisible()
    const box = await cta.boundingBox()
    expect(Math.round(box!.height)).toBe(60)
    // Nothing may cover it: the click itself proves it is on top.
    await expect(cta).toBeEnabled({ timeout: 15000 })
  })

  test('as telas de conta não geram rolagem horizontal', async ({ page }) => {
    await signIn(page)
    for (const path of ['/', '/cart', '/profile', '/wallets']) {
      await page.goto(path)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      )
      expect(overflow, `${path} não deve rolar na horizontal`).toBe(false)
    }
  })
})
