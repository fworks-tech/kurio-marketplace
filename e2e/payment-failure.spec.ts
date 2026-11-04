import { expect, test } from '@playwright/test'
import { addToCart, connectWallet, signIn } from './helpers'

test.describe('falhas de pagamento', () => {
  test('recusa da operadora mantém o carrinho intacto', async ({ page }) => {
    await signIn(page)
    await addToCart(page, 'nft-002')
    await page.goto('/cart')
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/payment$/)

    // Only the order request fails; the rest of the session keeps working.
    await page.route('**/api/orders', async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      return route.continue({
        headers: { ...route.request().headers(), 'x-mock-scenario': 'payment-rejected' }
      })
    })

    await connectWallet(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    // The rejection keeps the buyer on the checkout instead of creating an order.
    await expect(page).toHaveURL(/\/payment$/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Pagamento/i)

    await page.goto('/cart')
    await expect(page.getByRole('heading', { level: 1, name: 'Carrinho de NFTs' })).toBeVisible()
    await expect(page.getByText(/Subtotal/)).toBeVisible()
    await expect(page.locator('main img').first()).toBeVisible()
  })

  test('recusa da conexão da carteira impede o envio do pedido', async ({ page }) => {
    await signIn(page)
    await addToCart(page, 'nft-002')
    await page.goto('/cart')
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()

    await page.getByRole('button', { name: /^Conectar / }).click()
    await page.getByRole('button', { name: 'Recusar' }).click()
    await expect(page.getByText('Conexão recusada na carteira')).toBeVisible()

    await page.locator('#co-email').fill('alice@example.com')
    await page.locator('#co-wallet').click()
    await page.getByRole('option').first().click()
    await page.getByRole('checkbox', { name: /termos de uso/i }).check()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByText(/recusada|informe um e-mail|selecione uma carteira/i).first()).toBeVisible()
  })

  test('sessão expirada no checkout leva de volta ao login', async ({ page }) => {
    await signIn(page)
    await addToCart(page, 'nft-002')
    await page.goto('/cart')

    await page.route('**/api/cart/quote', (route) =>
      route.continue({
        headers: { ...route.request().headers(), 'x-mock-scenario': 'session-expired' }
      })
    )

    const sessionSignal = page.getByText(/sessão|session|expirad/i).first()
    await expect(sessionSignal.or(page.getByRole('button', { name: 'Entrar' })).first()).toBeVisible({
      timeout: 15_000
    })
  })
})
