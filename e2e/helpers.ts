import { expect, type Page } from '@playwright/test'

export const USER = { email: 'alice@example.com', password: 'password123' }

/** Sign in through the /login route and land back on the home page. */
export async function signIn(page: Page) {
  await page.goto('/login')
  await page.locator('#login-usuario').fill(USER.email)
  await page.locator('#login-senha').fill(USER.password)
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/$/)
}

/** Add a catalog NFT to the authenticated cart from its detail page. */
export async function addToCart(page: Page, nftId = 'nft-001', quantity = 1) {
  await page.goto(`/nfts/${nftId}`)
  const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
  for (let index = 1; index < quantity; index += 1) await increase.click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page.getByText('Adicionado ao carrinho.').first()).toBeVisible()
}

/** Fill the collector e-mail and terms the checkout requires, then connect a wallet. */
export async function connectWallet(page: Page) {
  const email = page.locator('#co-email')
  if ((await email.inputValue()) === '') await email.fill(USER.email)
  await page.getByRole('radio', { name: 'MetaMask' }).click()

  const walletField = page.locator('#co-wallet')
  if ((await walletField.getAttribute('role')) === 'combobox') {
    await walletField.click()
    await page.getByRole('option').first().click()
  }

  const connect = page.getByRole('button', { name: /^Conectar / })
  await expect(connect).toBeVisible()
  await connect.click()
  await page.getByRole('button', { name: 'Aprovar' }).click()
  await expect(page.getByRole('button', { name: 'Desconectar' })).toBeVisible()
  await page.getByRole('checkbox', { name: /termos de uso/i }).check()
}
