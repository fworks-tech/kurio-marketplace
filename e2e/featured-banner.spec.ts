import { expect, test } from "@playwright/test";

/** The sidebar promo below the filters: Figma "Featured NFT Banner". */
test.describe("NFT em destaque", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "o banner só existe no sidebar desktop",
    );
    await page.goto("/");
  });

  test("a arte do painel leva para o detalhe da obra", async ({ page }) => {
    const banner = page.getByTestId("featured-nft-link");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute("href", /\/nfts\/nft-/);
    await expect(banner).toHaveAttribute("aria-label", /^Ver detalhes de /);

    const artwork = banner.locator("img");
    const title = await artwork.getAttribute("alt");
    // The Figma panel draws this artwork, so it must survive the data binding.
    await expect(artwork).toHaveAttribute("src", /nft-18\.webp$/);

    await banner.click();
    await expect(page).toHaveURL(/\/nfts\/nft-/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title ?? "");
  });

  test("a imagem flutua, mas para com movimento reduzido", async ({ page }) => {
    const artwork = page.getByTestId("featured-nft-link").locator("img");
    await expect
      .poll(() =>
        artwork.evaluate((node) => getComputedStyle(node).animationName),
      )
      .toBe("kurio-float");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() =>
        artwork.evaluate((node) => getComputedStyle(node).animationName),
      )
      .toBe("none");
  });
});
