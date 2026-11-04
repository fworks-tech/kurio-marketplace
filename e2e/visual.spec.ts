import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { addToCart, signIn } from './helpers'

// Motion is disabled so the skeleton shimmer and hover transitions do not make
// the baselines flaky, and the viewport mirrors the Figma frames used per project.
test.use({ reducedMotion: 'reduce' })

/**
 * Baselines are stored per platform (`home-desktop-chromium-desktop-linux.png`).
 * A contributor on another OS skips instead of failing on a missing picture;
 * `UPDATE_BASELINES=1 npx playwright test e2e/visual.spec.ts --update-snapshots`
 * records the set for the machine it runs on.
 */
const UPDATING = Boolean(process.env.UPDATE_BASELINES)

function baselineMissing(testInfo: TestInfo, name: string) {
  const file = join(
    'e2e',
    'visual.spec.ts-snapshots',
    `${name}-${testInfo.project.name}-${process.platform}.png`
  )
  return !UPDATING && !existsSync(file)
}

/** The mocks ship webp art; shooting before it decodes swaps the cards for empty boxes. */
async function settle(page: Page) {
  await page.waitForFunction(() =>
    Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0)
  )
}

test.describe('baselines visuais', () => {
  test('home desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop baseline')
    test.skip(baselineMissing(testInfo, 'home-desktop'), 'sem baseline para esta plataforma')

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: /SEJA DONO DO FUTURO/ })).toBeVisible()
    await expect(page.locator('article:has(.text-price)').first()).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('home-desktop.png', { fullPage: true })
  })

  test('detalhe desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop baseline')
    test.skip(baselineMissing(testInfo, 'detail-desktop'), 'sem baseline para esta plataforma')

    await page.goto('/nfts/nft-003')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('detail-desktop.png', { fullPage: true })
  })

  test('carrinho desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop baseline')
    test.skip(baselineMissing(testInfo, 'cart-desktop'), 'sem baseline para esta plataforma')

    await signIn(page)
    await addToCart(page, 'nft-003')
    await page.goto('/cart')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('cart-desktop.png', { fullPage: true })
  })

  test('pagamento desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop baseline')
    test.skip(baselineMissing(testInfo, 'payment-desktop'), 'sem baseline para esta plataforma')

    await signIn(page)
    await addToCart(page, 'nft-003')
    await page.goto('/payment')
    await expect(page.getByRole('button', { name: 'Confirmar compra' }).first()).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('payment-desktop.png', { fullPage: true })
  })

  test('home mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-mobile', 'mobile baseline')
    test.skip(baselineMissing(testInfo, 'home-mobile'), 'sem baseline para esta plataforma')

    await page.goto('/')
    // The mobile frame carries its own headline copy, so match the shared opening.
    await expect(page.getByRole('heading', { level: 1, name: /SEJA DONO/ })).toBeVisible()
    await expect(page.locator('article:has(.text-price)').first()).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('home-mobile.png', { fullPage: true })
  })
})
