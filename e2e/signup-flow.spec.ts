import { expect, test } from "@playwright/test";
import { USER } from "./helpers";

/** Signup is viewport-agnostic; the desktop project runs it once. */
test.describe("cadastro", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "desktop project only",
    );
    await page.goto("/signup");
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("cria a conta, entra na aplicação e mantém a sessão", async ({
    page,
  }) => {
    const email = `nova-${Date.now()}@example.com`;
    const dialog = page.getByRole("dialog");
    await dialog.locator("#su-usuario").fill("Nova Colecionadora");
    await dialog.locator("#su-email").fill(email);
    await dialog.locator("#su-senha").fill("senha-segura");
    await dialog.locator("#su-confirmar").fill("senha-segura");

    const register = page.waitForResponse(
      (response) =>
        /\/api\/auth\/register$/.test(response.url()) &&
        response.status() === 200,
    );
    await dialog.getByRole("button", { name: "Criar conta" }).click();
    await register;

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("link", { name: "Nova Colecionadora" }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("link", { name: "Nova Colecionadora" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toHaveCount(0);
  });

  test("exige senhas iguais sem chamar a API", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    let called = false;
    page.on("request", (request) => {
      if (/\/api\/auth\/register$/.test(request.url())) called = true;
    });
    await dialog.locator("#su-usuario").fill("Nova Colecionadora");
    await dialog.locator("#su-email").fill("nova@example.com");
    await dialog.locator("#su-senha").fill("senha-segura");
    await dialog.locator("#su-confirmar").fill("senha-diferente");
    await dialog.getByRole("button", { name: "Criar conta" }).click();

    await expect(dialog.getByText("As senhas não coincidem.")).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
    expect(called).toBe(false);
  });

  test("mostra em português o erro para e-mail já cadastrado", async ({
    page,
  }) => {
    const dialog = page.getByRole("dialog");
    await dialog.locator("#su-usuario").fill("Alice Duplicada");
    await dialog.locator("#su-email").fill(USER.email);
    await dialog.locator("#su-senha").fill("senha-segura");
    await dialog.locator("#su-confirmar").fill("senha-segura");
    await dialog.getByRole("button", { name: "Criar conta" }).click();

    await expect(dialog.getByRole("alert")).toHaveText(
      "Este e-mail já está cadastrado.",
    );
  });

  test("valida usuário e senha curtos", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await dialog.locator("#su-usuario").fill("ab");
    await dialog.locator("#su-email").fill("curta@example.com");
    await dialog.locator("#su-senha").fill("1234");
    await dialog.locator("#su-confirmar").fill("1234");
    await dialog.getByRole("button", { name: "Criar conta" }).click();

    await expect(
      dialog.getByText("O usuário precisa ter ao menos 3 caracteres."),
    ).toBeVisible();
    await expect(
      dialog.getByText("A senha precisa ter ao menos 8 caracteres."),
    ).toBeVisible();
  });

  test("alterna entre entrar e criar conta no mesmo diálogo", async ({
    page,
  }) => {
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Entrar" }).click();
    await expect(dialog.locator("#login-usuario")).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
    await dialog.getByRole("tab", { name: "Criar conta" }).click();
    await expect(dialog.locator("#su-usuario")).toBeVisible();
  });
});
