import { expect, test, type Page } from "@playwright/test";

const priceValues = (page: Page) =>
  page
    .locator(".text-price")
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        Number.parseFloat((node.textContent ?? "").replace(/[^\d.]/g, "")),
      ),
    );

// Only catalog cards carry a price; the editorial blocks also render `article h3`.
const CARD_TITLE = "article:has(.text-price) h3";

const titles = (page: Page) =>
  page
    .locator(CARD_TITLE)
    .evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.trim() ?? ""),
    );

async function chooseSort(page: Page, option: string) {
  await page.locator("#catalog-sort").click();
  await page.getByRole("option", { name: option }).click();
  await expect(page.locator("#catalog-sort")).toHaveText(option);
}

test.describe("ordenação do catálogo", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "desktop project only",
    );
    await page.goto("/");
    await expect(page.locator(CARD_TITLE).first()).toBeVisible();
  });

  test("começa por listados recentemente", async ({ page }) => {
    await expect(page.locator("#catalog-sort")).toHaveText(
      "Listados recentemente",
    );
    await expect(page).not.toHaveURL(/sort=/);
  });

  test("ordena do menor para o maior preço", async ({ page }) => {
    await chooseSort(page, "Menor preço");
    await expect(page).toHaveURL(/sort=price_asc/);
    const values = await priceValues(page);
    expect(values.length).toBeGreaterThan(1);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  test("ordena do maior para o menor preço", async ({ page }) => {
    await chooseSort(page, "Maior preço");
    await expect(page).toHaveURL(/sort=price_desc/);
    const values = await priceValues(page);
    expect(values.length).toBeGreaterThan(1);
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });

  test("ordena por nome em ordem alfabética", async ({ page }) => {
    await chooseSort(page, "Nome (A–Z)");
    await expect(page).toHaveURL(/sort=name_asc/);
    const names = await titles(page);
    const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });
    expect(names).toEqual([...names].sort(collator.compare));
  });

  test("volta para a primeira página e para a aba de todos ao ordenar", async ({
    page,
  }) => {
    await page.goto("/?tab=alta&page=2");
    await expect(page.locator(CARD_TITLE).first()).toBeVisible();
    await chooseSort(page, "Em destaque");
    await expect(page).not.toHaveURL(/page=2/);
    await expect(page).not.toHaveURL(/tab=alta/);
    await expect(page).toHaveURL(/sort=featured/);
  });

  test("mantém a ordenação escolhida ao recarregar", async ({ page }) => {
    await chooseSort(page, "Maior preço");
    await expect(page).toHaveURL(/sort=price_desc/);
    await page.reload();
    await expect(page.locator("#catalog-sort")).toHaveText("Maior preço");
    const values = await priceValues(page);
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });
});
