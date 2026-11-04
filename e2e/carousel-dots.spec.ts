import { expect, test } from "@playwright/test";

test.describe("controles de carrossel", () => {
  test("os três pontos do hero trocam a obra em destaque", async ({ page }) => {
    await page.goto("/");

    const dots = page
      .getByRole("group", { name: "Obras em destaque" })
      .getByRole("button");
    await expect(dots).toHaveCount(3);
    await expect(dots.first()).toHaveAttribute("aria-current", "true");

    const artwork = page.locator("section img").first();
    const firstSrc = await artwork.getAttribute("src");

    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
    await expect(artwork).not.toHaveAttribute("src", firstSrc ?? "");
    await expect(page.getByText("Obra 2 de 3:")).toBeAttached();

    await dots.nth(2).click();
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
    await expect(page.getByText("Obra 3 de 3:")).toBeAttached();
  });

  test('os pontos de "Mais desta coleção" paginam os relacionados', async ({
    page,
  }) => {
    await page.goto("/");
    const firstCard = page.locator("article:has(.text-price) h3").first();
    await expect(firstCard).toBeVisible();
    await page.locator('a[href^="/nfts/"]').first().click();

    const dots = page
      .getByRole("group", { name: "Mais desta coleção" })
      .getByRole("button");
    await expect(dots.first()).toBeVisible();
    test.skip((await dots.count()) < 2, "poucos relacionados para paginar");

    const listed = page.locator("article:has(.text-price) h3");
    const before = await listed.allTextContents();

    await dots.last().click();
    await expect
      .poll(async () => (await listed.allTextContents()).join("|"))
      .not.toBe(before.join("|"));
  });
});
