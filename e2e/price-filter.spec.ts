import { expect, test, type Page } from "@playwright/test";

const prices = (page: Page) =>
  page
    .locator("article:has(.text-price) .text-price")
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        Number.parseFloat((node.textContent ?? "").replace(/[^\d.]/g, "")),
      ),
    );

/** Waits for the filtered payload, then checks every visible card price. */
async function expectPricesWithin(page: Page, min: number, max: number) {
  await expect
    .poll(async () => {
      const values = await prices(page);
      if (values.length === 0) return "sem cards";
      const out = values.filter((value) => value < min || value > max);
      return out.length === 0 ? "ok" : `fora da faixa: ${out.join(", ")}`;
    })
    .toBe("ok");
}

async function typeRange(page: Page, min: string, max: string) {
  await page.getByRole("textbox", { name: "Preço mínimo" }).fill(min);
  await page.getByRole("textbox", { name: "Preço máximo" }).fill(max);
  await page.getByRole("textbox", { name: "Preço máximo" }).press("Enter");
  await page.getByRole("button", { name: "Aplicar" }).first().click();
}

/**
 * The designer's note on the catalog asks for two typed fields next to the slider,
 * because dragging is imprecise on touch screens (Figma comment #5).
 */
test.describe("faixa de preço digitada", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "desktop project only",
    );
    await page.goto("/");
    const minField = page.getByRole("textbox", { name: "Preço mínimo" });
    await expect(minField).toBeVisible();
    // Bounds come with the facets request; filling before that only reads defaults.
    await expect(minField).not.toHaveValue("");
  });

  test("filtra pelo mínimo e máximo digitados", async ({ page }) => {
    await typeRange(page, "2", "5");

    await expect(page).toHaveURL(/[?&]min=/);
    await expect(page).toHaveURL(/[?&]max=/);
    await expect(page.locator("article:has(.text-price) .text-price").first()).toBeVisible();
    await expectPricesWithin(page, 2, 5);
  });

  test("inverte os campos quando o mínimo passa do máximo", async ({ page }) => {
    await typeRange(page, "5", "2");

    await expectPricesWithin(page, 2, 5);
    await expect(page.getByRole("textbox", { name: "Preço mínimo" })).toHaveValue("2");
    await expect(page.getByRole("textbox", { name: "Preço máximo" })).toHaveValue("5");
  });
});
