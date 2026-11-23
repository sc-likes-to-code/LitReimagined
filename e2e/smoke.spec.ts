import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PAGES = [
  "/",
  "/explore",
  "/books/pride-and-prejudice",
  "/authors",
  "/authors/jane-austen",
  "/collections",
  "/collections/dark-and-gothic",
  "/how-it-works",
  "/about",
  "/library",
  "/login",
  "/signup",
  "/read/pride-and-prejudice/1",
];

/** Console noise we expect and accept in development. */
const IGNORED = [/Download the React DevTools/i, /Fast Refresh/i, /\[HMR\]/i];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORED.some((r) => r.test(m.text())))
      errors.push(m.text());
  });
  return errors;
}

for (const path of PAGES) {
  test(`loads ${path} without errors`, async ({ page }) => {
    const errors = trackErrors(page);
    const res = await page.goto(path, { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });
}

test("unknown pages show the designed 404", async ({ page }) => {
  // Streamed routes render the not-found UI (status can be 200 once the shell has been sent).
  await page.goto("/books/not-a-real-book");
  await expect(page.getByRole("heading", { name: /wandered off/i })).toBeVisible();
});

test("the modernization slider changes the text on the home page", async ({ page }) => {
  await page.goto("/");
  const demo = page.locator("#try-it");
  await demo.scrollIntoViewIfNeeded();
  await expect(demo).toContainText("It is a truth universally acknowledged");
  await demo.getByRole("button", { name: "Contemporary" }).click();
  await expect(demo).toContainText("Everybody knows a rich, single guy");
});

test("explore filters update the URL and the results", async ({ page }) => {
  await page.goto("/explore", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gothic", exact: true }).first().click();
  await expect(page).toHaveURL(/genre=Gothic/);
  await expect(page.getByText(/\d+ books?/).first()).toBeVisible();
  await page.getByRole("button", { name: /clear all/i }).click();
  await expect(page).not.toHaveURL(/genre=/);
});

test("the reader switches between the original and the modern version", async ({
  page,
}) => {
  await page.goto("/read/pride-and-prejudice/1");
  const body = page.locator("article");
  await page.getByRole("button", { name: "Original", exact: true }).click();
  await expect(body).toContainText("It is a truth universally acknowledged");
  await page.getByRole("button", { name: "Modern", exact: true }).click();
  await expect(body).toContainText("It is a truth everyone accepts");
  // Chapters without a modern version fall back to the original with a notice.
  await page.goto("/read/pride-and-prejudice/2");
  await expect(page.getByText(/still being written/i)).toBeVisible();
});

test("a book can be added to the shelf and appears in the library", async ({ page }) => {
  await page.goto("/books/dracula");
  await page.getByRole("button", { name: "Want to read" }).click();
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Shelves" })).toBeVisible();
  await expect(page.getByText("Dracula").first()).toBeVisible();
});

test("live AI works in demo mode and shows the quill panel", async ({ page }) => {
  await page.goto("/read/pride-and-prejudice/1");
  await page.getByRole("button", { name: "Original", exact: true }).click();
  await page.evaluate(() => {
    const p = document.querySelector('[data-p="1"]')!;
    const r = document.createRange();
    r.selectNodeContents(p);
    const s = window.getSelection()!;
    s.removeAllRanges();
    s.addRange(r);
  });
  await page.getByRole("button", { name: "Explain" }).click();
  await expect(page.getByRole("dialog", { name: "The quill" })).toContainText(
    "demo explanation",
    { timeout: 15_000 },
  );
});

test.describe("accessibility", () => {
  for (const path of [
    "/",
    "/explore",
    "/books/pride-and-prejudice",
    "/login",
    "/read/pride-and-prejudice/1",
    "/library",
  ]) {
    test(`no serious violations on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const bad = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(
        bad.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(" ")}`),
      ).toEqual([]);
    });
  }
});
