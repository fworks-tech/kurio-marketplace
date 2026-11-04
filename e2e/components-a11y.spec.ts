import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('shared components page', () => {
  test('renders without client errors and exposes interactive controls', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto('/components')

    await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' }).first()).toBeVisible()
    await expect(page.getByRole('radio', { name: /Carteira principal/ }).first()).toBeVisible()
    expect(errors).toEqual([])
  })

  test('keyboard focus moves with Tab from an interactive control', async ({ page }) => {
    await page.goto('/components')
    const stepper = page.getByRole('button', { name: 'Aumentar quantidade' }).first()
    await stepper.focus()
    const before = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
    await page.keyboard.press('Tab')
    const after = await page.evaluate(
      () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName
    )
    expect(after).not.toBe(before)
  })

  test('filter drawer closes with Escape and returns focus to the trigger', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-desktop', 'drawer trigger is mobile-only')
    await page.goto('/components')
    const trigger = page.getByRole('button', { name: 'Filtros' })
    await expect(trigger).toBeVisible()
    await trigger.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  // follow-up (docs/tasks/frontend/02-followups.md): contrast token, tabs aria-controls, label mismatches
  test.fixme('has no axe serious or critical violations', async ({ page }) => {
    await page.goto('/components')
    await expect(page.getByRole('radio', { name: /Carteira principal/ }).first()).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    )
    expect(blocking).toEqual([])
  })
})
