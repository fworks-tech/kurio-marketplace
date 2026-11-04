import { test, expect } from '@playwright/test'

test('home shell renders with brand, heading and live region', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /SEJA DONO D/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Kurio' })).toBeVisible()
  await expect(page.locator('[aria-live="polite"]').first()).toBeAttached()
  expect(errors).toEqual([])
})

test('primary navigation link is keyboard-focusable', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Kurio' }).focus()
  const focusedIsBrand = await page.evaluate(() =>
    document.activeElement?.hasAttribute('data-brand') ?? false
  )
  expect(focusedIsBrand).toBe(true)
})

test('client-side navigation moves between routes', async ({ page }) => {
  await page.goto('/')

  // /cart renders its guard in place, so sign in first through the auth route.
  await page.goto('/login')
  await page.locator('#login-usuario').fill('alice@example.com')
  await page.locator('#login-senha').fill('password123')
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/')

  await page.locator('header').first().getByRole('link', { name: 'Carrinho' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Carrinho de NFTs' })).toBeVisible()
})

test('login dialog opens in place without changing route or page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'chromium-mobile', 'header Entrar renders at sm+; the sheet shares the handler')

  await page.goto('/nfts/nft-001')
  await page.locator('header').first().getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page).toHaveURL(/\/nfts\/nft-001$/)
  // modal dialogs aria-hide the rest of the page, so role queries cannot see the backdrop — assert it via DOM
  await expect(page.locator('main h1')).toHaveText('Cyberpunk Ape #1')

  await page.locator('#login-usuario').fill('alice@example.com')
  await page.locator('#login-senha').fill('password123')
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/nfts\/nft-001$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Cyberpunk Ape #1' })).toBeVisible()
})

test('deep link to a dynamic route resolves without 404', async ({ page }) => {
  await page.goto('/nfts/nft-001')
  await expect(page.getByRole('heading', { level: 1, name: 'Cyberpunk Ape #1' })).toBeVisible()
})

test('unauthenticated visit to a protected route redirects to login with return path', async ({
  page
}) => {
  await page.goto('/payment')
  await expect(page).toHaveURL(/\/login\?redirect=%2Fpayment$/)
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
})

test('os itens sem destino do menu não navegam', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop nav only')
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Navegação principal' })
  for (const label of ['Mercado', 'Criadores', 'Aprenda']) {
    await expect(nav.getByRole('link', { name: label })).toHaveCount(0)
    // O rótulo vem seguido de "(em breve)" para leitores de tela.
    const item = nav.locator('span[aria-disabled="true"]').filter({ hasText: label }).first()
    await expect(item).toHaveAttribute('aria-disabled', 'true')
  }
  // Início continua levando para a home.
  await expect(nav.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/')
})
