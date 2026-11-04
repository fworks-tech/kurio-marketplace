import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

test.describe('perfil do colecionador', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.goto('/profile')
    await expect(page.getByRole('heading', { level: 1, name: 'Perfil do colecionador' })).toBeVisible()
  })

  test('editar o nome de exibição persiste após recarregar', async ({ page }) => {
    const form = page.locator('form:visible').first()
    const field = form.getByLabel('Nome de exibição', { exact: false }).first()
    const updated = 'Alice Colecionadora'
    await field.fill(updated)
    const saved = page.waitForResponse(
      (response) => /\/api\/profile$/.test(response.url()) && response.request().method() === 'PATCH'
    )
    await form.getByRole('button', { name: 'Salvar' }).first().click()
    await saved

    await expect(page.getByText(/atualizad|salv/i).first()).toBeVisible()

    await page.reload()
    await expect(
      page.locator('form:visible').first().getByLabel('Nome de exibição', { exact: false }).first()
    ).toHaveValue(updated)
  })

  test('senha nova curta é recusada', async ({ page }) => {
    await page.getByLabel('Senha atual', { exact: true }).fill('password123')
    await page.getByLabel('Nova senha', { exact: true }).fill('123')
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill('123')
    await page.getByRole('button', { name: 'Salvar' }).last().click()
    await expect(page.getByText(/caracteres|não conferem|senha/i).first()).toBeVisible()
  })
})

test.describe('carteiras', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.goto('/wallets')
    await expect(page.getByRole('heading', { level: 1, name: 'Carteira principal' })).toBeVisible()
  })

  test('carteira principal vem preenchida com os dados da sessão', async ({ page }) => {
    await expect(page.locator('input[name="walletLabel"]').first()).not.toHaveValue('')
    await expect(page.locator('input[name="walletLabel"]').first()).toBeEditable()
  })

  test('carteira secundária espelha a principal por padrão', async ({ page }) => {
    await page.getByRole('button', { name: 'Adicionar' }).last().click()
    const mirrored = page.locator('input[name="address"]').last()
    await expect(mirrored).toHaveAttribute('readonly', '')
    await expect(mirrored).toHaveValue(/^0x/)

    await page.getByRole('checkbox', { name: /Igual à carteira principal/i }).uncheck()
    await expect(mirrored).not.toHaveAttribute('readonly', '')
  })
})

test.describe('sessão', () => {
  test('sair encerra a sessão e protege as rotas privadas', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 1024, 'o menu de conta só aparece no desktop')
    await signIn(page)
    await page.getByRole('button', { name: 'Sair' }).click()
    await page.waitForTimeout(600)
    await page.reload()

    await expect(page.getByRole('link', { name: 'alice_crypto' })).toHaveCount(0, { timeout: 10_000 })
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { level: 1, name: 'Perfil do colecionador' })).toHaveCount(0)
  })
})
