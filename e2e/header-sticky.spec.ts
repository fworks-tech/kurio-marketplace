import { test, expect } from '@playwright/test'

// The Figma header sits 24px below the top of the frame. That gap has to stay
// with the sticky bar, otherwise scrolling snaps the bar to the viewport edge
// and the spacing looks like it disappeared.
test.describe('header fixo', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, 'desktop chrome only')

  test('mantém os 24px acima da barra depois do scroll', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const nav = page.locator('header nav').first()
    const before = await nav.boundingBox()
    expect(before?.y).toBeCloseTo(24, 0)

    await page.mouse.wheel(0, 1600)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

    const after = await nav.boundingBox()
    expect(after?.y).toBeCloseTo(24, 0)
  })
})
