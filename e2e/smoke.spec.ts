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

test("the quill panel shows an explanation (AI response mocked, so no quota is used)", async ({
  page,
}) => {
  await page.route("**/api/ai/explain", (route) =>
    route.fulfill({
      json: {
        ok: true,
        output: { meaning: "A mocked plain-English reading.", note: "A mocked note." },
        cached: false,
        demo: false,
        remaining: 2,
        limit: 3,
      },
    }),
  );
  await page.goto("/read/pride-and-prejudice/1", { waitUntil: "networkidle" });
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
    "A mocked plain-English reading.",
    {
      timeout: 15_000,
    },
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

test("a selected passage becomes a downloadable quote card", async ({ page, isMobile }) => {
  test.skip(isMobile, "Download checks run on desktop.");
  await page.goto("/read/pride-and-prejudice/1", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Original", exact: true }).click();
  await page.evaluate(() => {
    const p = document.querySelector('[data-p="1"]')!;
    const r = document.createRange();
    r.selectNodeContents(p);
    const s = window.getSelection()!;
    s.removeAllRanges();
    s.addRange(r);
  });
  await page.getByRole("button", { name: "Card", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Make a quote card" });
  await expect(dialog).toBeVisible();

  // The canvas is really painted (not blank) and changes size with the shape.
  const size = () =>
    dialog.locator("canvas").evaluate((c: HTMLCanvasElement) => [c.width, c.height]);
  expect(await size()).toEqual([1080, 1350]);
  await dialog.getByRole("button", { name: "Story" }).click();
  await expect.poll(size).toEqual([1080, 1920]);
  await dialog.getByRole("button", { name: "Paper" }).click();
  const painted = await dialog.locator("canvas").evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    const seen = new Set<number>();
    for (let i = 0; i < d.length; i += 4 * 997) seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    return seen.size;
  });
  expect(painted).toBeGreaterThan(20);

  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download image" }).click();
  expect((await download).suggestedFilename()).toMatch(/pride-and-prejudice-quote\.png$/);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("read aloud speaks paragraph by paragraph and can be paused and stopped", async ({
  page,
}) => {
  // A fake speech engine, so the test is silent and does not depend on installed voices.
  await page.addInitScript(() => {
    const spoken: string[] = [];
    (window as unknown as { __spoken: string[] }).__spoken = spoken;
    class FakeUtterance {
      text: string;
      rate = 1;
      lang = "";
      voice: unknown = null;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((e: { error: string }) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    let queue: FakeUtterance[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pump = () => {
      const u = queue.shift();
      if (!u) return;
      spoken.push(u.text);
      u.onstart?.();
      timer = setTimeout(() => {
        u.onend?.();
        pump();
      }, 150);
    };
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: FakeUtterance });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [],
        speak: (u: FakeUtterance) => {
          queue.push(u);
          if (queue.length === 1 && !timer) pump();
        },
        cancel: () => {
          queue = [];
          clearTimeout(timer);
          timer = undefined;
        },
      },
    });
  });

  await page.goto("/read/alices-adventures-in-wonderland/1", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Read aloud" }).click();
  const bar = page.getByRole("region", { name: "Read aloud" });
  await expect(bar).toBeVisible();
  await expect(page.locator('[data-speaking="true"]')).toHaveCount(1);

  // It advances on its own.
  const first = await page.locator("[data-speaking='true']").getAttribute("data-p");
  await expect
    .poll(() => page.locator("[data-speaking='true']").getAttribute("data-p"))
    .not.toBe(first);

  await bar.getByRole("button", { name: "Pause reading" }).click();
  await expect(bar.getByRole("button", { name: "Resume reading" })).toBeVisible();
  await bar.getByRole("button", { name: /Speed/ }).click();
  await expect(bar.getByRole("button", { name: /Speed 1.25x/ })).toBeVisible();
  await bar.getByRole("button", { name: "Resume reading" }).click();
  await expect(bar.getByRole("button", { name: "Pause reading" })).toBeVisible();

  await bar.getByRole("button", { name: "Stop reading" }).click();
  await expect(bar).toBeHidden();
  await expect(page.locator('[data-speaking="true"]')).toHaveCount(0);
});
