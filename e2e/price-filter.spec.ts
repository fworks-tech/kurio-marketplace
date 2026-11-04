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

/** Moves a range thumb to a fraction of its travel, like a drag would. */
async function setSlider(
  page: Page,
  name: "Preço mínimo" | "Preço máximo",
  fraction: number,
) {
  await page.evaluate(
    ({ name, fraction }) => {
      const input = document.querySelector<HTMLInputElement>(
        `input[type="range"][aria-label="${name}"]`,
      );
      if (!input) throw new Error(`slider ausente: ${name}`);
      const low = Number(input.min);
      const high = Number(input.max);
      const next = Math.round(low + (high - low) * fraction);
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(input, String(next));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { name, fraction },
  );
}

/** Reads "Preço: 0,02 - 12,30 ETH" and returns both numbers in ETH. */
async function readRange(page: Page) {
  const label = await page
    .locator("span")
    .filter({ hasText: /^Preço: .* ETH$/ })
    .first()
    .textContent();
  const [low = Number.NaN, high = Number.NaN] = (label ?? "")
    .replace("Preço:", "")
    .replace("ETH", "")
    .split("-")
    .map((value) => Number.parseFloat(value.trim().replace(",", ".")));
  return { low, high };
}

/**
 * The frame only draws the slider, the "Preço:" readout and the Aplicar button.
 * The typed min/max fields added earlier were an invention and were removed.
 */
test.describe("faixa de preço", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "desktop project only",
    );
    await page.goto("/");
    await expect(
      page.getByRole("slider", { name: "Preço mínimo" }),
    ).toBeVisible();
  });

  test("não existem campos digitáveis, só o slider", async ({ page }) => {
    await expect(
      page.getByRole("slider", { name: "Preço mínimo" }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("slider", { name: "Preço máximo" }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("textbox", { name: "Preço mínimo" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "Preço máximo" }),
    ).toHaveCount(0);
  });

  test("aplica a faixa escolhida no slider", async ({ page }) => {
    await setSlider(page, "Preço mínimo", 0.15);
    await setSlider(page, "Preço máximo", 0.45);

    await page.getByRole("button", { name: "Aplicar" }).first().click();

    const params = () => new URL(page.url()).searchParams;
    await expect.poll(() => params().get("min")).not.toBe("20000");
    await expect.poll(() => params().get("max")).not.toBeNull();

    // The URL carries the micro units sent to the catalog; the grid must obey them.
    const sentMin = Number(params().get("min")) / 1_000_000;
    const sentMax = Number(params().get("max")) / 1_000_000;
    expect(sentMax).toBeGreaterThan(sentMin);
    await expectPricesWithin(page, sentMin, sentMax);
  });

  test("os punhos não se cruzam", async ({ page }) => {
    await setSlider(page, "Preço mínimo", 0.8);
    await setSlider(page, "Preço máximo", 0.2);

    await expect
      .poll(async () => {
        const { low, high } = await readRange(page);
        return Number.isNaN(low) || Number.isNaN(high) ? "aguardando" : String(low <= high);
      })
      .toBe("true");
  });
});
