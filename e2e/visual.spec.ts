import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from '@playwright/test'

// Motion is disabled so the skeleton shimmer does not make the baseline flaky.
test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } })

// Pixel baselines are per-platform; real per-screen baselines arrive with the
// screens (later tasks). Run this in the desktop project and only when a
// committed baseline exists for the current platform, so other environments
// skip rather than report a false failure.
const baseline = join(
  'e2e',
  'visual.spec.ts-snapshots',
  `home-shell-chromium-desktop-${process.platform}.png`
)

test('home shell matches the committed baseline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop project only')
  test.skip(!existsSync(baseline), `no ${process.platform} baseline committed yet`)

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /SEJA DONO DO FUTURO/ })).toBeVisible()
  await expect(page).toHaveScreenshot('home-shell.png', { fullPage: true })
})
