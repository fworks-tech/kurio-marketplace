import { expect, test } from '@playwright/test'
import { addToCart, signIn } from './helpers'

test.describe('cupom de desconto', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await addToCart(page, 'nft-003')
    await page.goto('/cart')
  })

  test('cupom válido aplica desconto no resumo', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Cupom de desconto' }).fill('WELCOME10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText(/Cupom WELCOME10 aplicado/i)).toBeVisible()
    await expect(page.getByText(/desconto/i).first()).toBeVisible()
  })

  test('cupom inexistente exibe erro acessível', async ({ page }) => {
    const input = page.getByRole('textbox', { name: 'Cupom de desconto' })
    await input.fill('INVALID99')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').first()).toContainText(/inválido|expirado/i)
    await expect(page.getByText(/Cupom inválido ou expirado/i)).toBeVisible()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  test('cupom expirado é recusado', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Cupom de desconto' }).fill('EXPIRED20')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').first()).toContainText(/expirado|inválido/i)
  })

  test('remover o cupom devolve o total original', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Cupom de desconto' }).fill('WELCOME10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await page.getByRole('button', { name: 'Remover cupom' }).click()
    await expect(page.getByText(/Cupom WELCOME10 aplicado/i)).toHaveCount(0)
  })
})
