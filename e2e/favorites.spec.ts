import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers";

const CARD_TITLE = "article:has(.text-price) h3";

/** Favorite buttons are labelled by NFT, so the title doubles as the handle. */
const favoriteButton = (page: Page, title: string, state: "add" | "remove") =>
  page.getByRole("button", {
    name:
      state === "add" ? `Favoritar ${title}` : `Remover ${title} dos favoritos`,
  });

/** Card actions are revealed on hover (Figma), so the pointer has to reach the card first. */
async function favoriteFromCard(
  page: Page,
  title: string,
  state: "add" | "remove",
) {
  await page.locator("article:has(.text-price)").first().hover();
  await favoriteButton(page, title, state).click();
}

async function firstCardTitle(page: Page) {
  const title = await page.locator(CARD_TITLE).first().textContent();
  return title?.trim() ?? "";
}

test.describe("favoritos", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "desktop project only",
    );
    await page.goto("/");
    await expect(page.locator(CARD_TITLE).first()).toBeVisible();
  });

  test("pede login quando o visitante tenta favoritar", async ({ page }) => {
    const title = await firstCardTitle(page);
    await favoriteFromCard(page, title, "add");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator("#login-usuario")).toBeVisible();
  });

  test("favorita um NFT e mantém após recarregar", async ({ page }) => {
    await signIn(page);
    await expect(page.locator(CARD_TITLE).first()).toBeVisible();
    const title = await firstCardTitle(page);

    await favoriteFromCard(page, title, "add");
    await expect(favoriteButton(page, title, "remove")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.reload();
    await expect(favoriteButton(page, title, "remove")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("desfavorita pelo mesmo botão", async ({ page }) => {
    await signIn(page);
    await expect(page.locator(CARD_TITLE).first()).toBeVisible();
    const title = await firstCardTitle(page);

    await favoriteFromCard(page, title, "add");
    await expect(favoriteButton(page, title, "remove")).toBeVisible();
    await favoriteFromCard(page, title, "remove");
    await expect(favoriteButton(page, title, "add")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("o favorito do detalhe aparece no card da home", async ({ page }) => {
    await signIn(page);
    await expect(page.locator(CARD_TITLE).first()).toBeVisible();
    const title = await firstCardTitle(page);
    await page
      .getByRole("link", { name: `Ver detalhes de ${title}` })
      .first()
      .click();

    const detailFavorite = page.getByRole("button", { name: "Favoritar" });
    await detailFavorite.click();
    await expect(detailFavorite).toHaveAttribute("aria-pressed", "true");

    await page.goto("/");
    await expect(favoriteButton(page, title, "remove")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
