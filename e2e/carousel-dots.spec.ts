import { expect, test } from "@playwright/test";

test.describe("controles de carrossel", () => {
  test("os três pontos do hero trocam a obra em destaque", async ({ page }) => {
    await page.goto("/");

    const dots = page
      .getByRole("group", { name: "Obras em destaque" })
      .getByRole("button");
    await expect(dots).toHaveCount(3);
    await expect(dots.first()).toHaveAttribute("aria-current", "true");

    // All artworks are stacked and cross-faded, so the visible one is the
    // image that is not aria-hidden.
    const carousel = page.getByRole("group", {
      name: "Carrossel de obras em destaque",
    });
    const artwork = carousel.locator('img[aria-hidden="false"]').first();
    const firstSrc = await artwork.getAttribute("src");
    expect(firstSrc).toContain("Frame-136");

    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
    await expect(artwork).toHaveAttribute("src", /nft-05/);
    await expect(page.getByText("Obra 2 de 3:")).toBeAttached();

    await dots.nth(2).click();
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
    await expect(artwork).toHaveAttribute("src", /nft-09/);
    await expect(page.getByText("Obra 3 de 3:")).toBeAttached();

    // Every slide shows a different artwork.
    const sources = await carousel
      .locator("img")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("src")));
    expect(new Set(sources).size).toBe(sources.length);
  });

  test("as setas e o teclado navegam o hero para os lados", async ({ page }) => {
    await page.goto("/");
    const dots = page
      .getByRole("group", { name: "Obras em destaque" })
      .getByRole("button");

    await page.getByRole("button", { name: "Próxima obra" }).click();
    await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");

    await page.getByRole("button", { name: "Próxima obra" }).click();
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");

    // Wraps back to the first work.
    await page.getByRole("button", { name: "Próxima obra" }).click();
    await expect(dots.first()).toHaveAttribute("aria-current", "true");

    await page.getByRole("button", { name: "Obra anterior" }).click();
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");

    await page
      .getByRole("group", { name: "Carrossel de obras em destaque" })
      .focus();
    await page.keyboard.press("ArrowRight");
    await expect(dots.first()).toHaveAttribute("aria-current", "true");
    await page.keyboard.press("ArrowLeft");
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
  });

  test("arrastar o hero para o lado troca a obra", async ({ page, isMobile }) => {
    test.skip(!isMobile, "gesto de toque só faz sentido no mobile");
    await page.goto("/");

    const dots = page
      .getByRole("group", { name: "Obras em destaque" })
      .getByRole("button");

    const swipe = ([from, to]: [number, number]) => {
      const carousel = document.querySelector(
        '[aria-label="Carrossel de obras em destaque"]',
      ) as HTMLElement;
      const surface = [...carousel.querySelectorAll("div")].find((node) =>
        node.querySelector("img"),
      ) as HTMLElement;
      const start = new Touch({
        identifier: 1,
        target: surface,
        clientX: from,
        clientY: 300,
      });
      surface.dispatchEvent(
        new TouchEvent("touchstart", {
          touches: [start],
          changedTouches: [start],
          bubbles: true,
        }),
      );
      const end = new Touch({
        identifier: 1,
        target: surface,
        clientX: to,
        clientY: 305,
      });
      surface.dispatchEvent(
        new TouchEvent("touchend", {
          touches: [],
          changedTouches: [end],
          bubbles: true,
        }),
      );
    };

    await page.evaluate(swipe, [300, 120] as [number, number]);
    await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");

    await page.evaluate(swipe, [120, 300] as [number, number]);
    await expect(dots.first()).toHaveAttribute("aria-current", "true");
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
