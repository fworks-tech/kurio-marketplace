import { expect, test } from '@playwright/test'
import { addToCart, connectWallet, signIn } from './helpers'

test.describe('fluxo de compra', () => {
  test('do detalhe do NFT até a confirmação do pedido', async ({ page }) => {
    await signIn(page)
    await addToCart(page, 'nft-001', 2)

    await page.locator('header').first().getByRole('link', { name: 'Carrinho' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Carrinho de NFTs' })).toBeVisible()

    await page.getByRole('textbox', { name: 'Cupom de desconto' }).fill('WELCOME10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText(/Cupom WELCOME10 aplicado/i)).toBeVisible()

    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/payment$/)
    await expect(page.getByRole('region', { name: 'Perfil do colecionador' })).toBeVisible()

    await connectWallet(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    // The mock answers pending and the realtime channel promotes it to confirmed.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      /Compra realizada!|Pedido em processamento/i,
      { timeout: 15_000 }
    )
    await expect(page.getByText(/^Pedido #/)).toBeVisible()
    await expect(page.getByText(/pendente|confirmad|concluíd/i).first()).toBeVisible()
  })

  test('carrinho vazio bloqueia o checkout', async ({ page }) => {
    await signIn(page)
    await page.goto('/payment')
    await expect(page.getByText(/carrinho está vazio/i)).toBeVisible()
  })
})
