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

/** The scrolling reader is no longer the default, so tests of it ask for it. */
const scrollMode = (page: Page) =>
  page.addInitScript(() => {
    if (!localStorage.getItem("lr:prefs:v1"))
      localStorage.setItem("lr:prefs:v1", JSON.stringify({ mode: "scroll" }));
  });

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

test("'Try the slider' scrolls to the demo every time, not just the first", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(120_000);
  await page.goto("/", { waitUntil: "networkidle" });
  for (let i = 0; i < 3; i++) {
    if (!isMobile) {
      await page.mouse.move(600, 400);
      await page.mouse.wheel(0, -8000);
    } else await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);
    await page.getByRole("link", { name: "Try the slider" }).click();
    await expect
      .poll(
        () =>
          page
            .locator("#try-it")
            .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
        {
          timeout: 8000,
        },
      )
      .toBeLessThan(200);
    await expect
      .poll(() =>
        page.locator("#try-it").evaluate((el) => el.getBoundingClientRect().top),
      )
      .toBeGreaterThan(0);
  }
});

test("the logo always takes you to the very top of the home page", async ({ page }) => {
  test.setTimeout(120_000);
  const logo = () => page.getByRole("link", { name: "LitReimagined home" }).first();
  const atTop = () =>
    expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBeLessThan(3);

  // From far down the home page.
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 2500));
  await page.waitForTimeout(600);
  await logo().click();
  await atTop();

  // From the middle of another page, and from one with a hash.
  await page.goto("/explore", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(600);
  await logo().click();
  await expect(page).toHaveURL(/\/$/);
  await atTop();

  await page.getByRole("link", { name: "Try the slider" }).click();
  await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBeGreaterThan(500);
  await logo().click();
  await atTop();
  await expect(page).toHaveURL(/\/$/);
});

test("the page stays still while search is open and scrolls again after", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The search button lives in the desktop nav.");
  await page.goto("/", { waitUntil: "networkidle" });
  const y = () => page.evaluate(() => Math.round(scrollY));
  await page.mouse.move(900, 450);
  await page.mouse.wheel(0, 600);
  await expect.poll(y).toBeGreaterThan(300);

  await page.getByRole("button", { name: /Search/ }).click();
  await expect(page.getByRole("dialog", { name: "Search and navigate" })).toBeVisible();
  const before = await y();
  await page.mouse.wheel(0, 800);
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(1200);
  expect(await y()).toBe(before);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Search and navigate" })).toBeHidden();
  await page.mouse.wheel(0, 800);
  await expect.poll(y).toBeGreaterThan(before + 300);
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
  await scrollMode(page);
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
  await scrollMode(page);
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

test("a selected passage becomes a downloadable quote card", async ({
  page,
  isMobile,
}) => {
  await scrollMode(page);
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
    for (let i = 0; i < d.length; i += 4 * 997)
      seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
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

  await page.goto("/read/alices-adventures-in-wonderland/1", {
    waitUntil: "networkidle",
  });
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

test("side-by-side view labels each column with its version", async ({
  page,
  isMobile,
}) => {
  await scrollMode(page);
  test.skip(isMobile, "The sticky column header is a desktop layout.");
  await page.goto("/read/alices-adventures-in-wonderland/1", {
    waitUntil: "networkidle",
  });
  await page.keyboard.press("s");
  const header = page
    .locator("div[aria-hidden='true']", { hasText: "Original version" })
    .first();
  await expect(header).toContainText("Original version");
  await expect(header).toContainText("Modern version");
});

/** Local calendar date key n days before today, matching the app's own day keys. */
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test("reading for a while records words for today", async ({ page }) => {
  await scrollMode(page);
  await page.goto("/read/alices-adventures-in-wonderland/1", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1300);
  await page.locator('[data-row="3"]').scrollIntoViewIfNeeded();
  await page
    .locator('[data-row="3"]')
    .evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(1500);
  const words = await page.evaluate(() => {
    const raw = localStorage.getItem("lr:activity:v1");
    return raw
      ? (Object.values(JSON.parse(raw)) as number[]).reduce((a, b) => a + b, 0)
      : 0;
  });
  expect(words).toBeGreaterThan(20);
});

test("the library shows the streak and calendar from reading history", async ({
  page,
}) => {
  const activity = {
    [daysAgo(0)]: 400,
    [daysAgo(1)]: 220,
    [daysAgo(2)]: 180,
    [daysAgo(5)]: 900,
  };
  await page.addInitScript((a) => {
    localStorage.setItem("lr:activity:v1", JSON.stringify(a));
    localStorage.setItem(
      "lr:shelf:v1",
      JSON.stringify({ dracula: { status: "reading", updatedAt: Date.now() } }),
    );
  }, activity);
  await page.goto("/library", { waitUntil: "networkidle" });

  const section = page.getByRole("region", { name: "Reading rhythm" });
  await expect(section).toContainText("Today is done");
  await expect(
    section.getByText("Day streak").locator("..").getByText("3", { exact: true }),
  ).toBeVisible();
  await expect(
    section.getByText("Days read").locator("..").getByText("4", { exact: true }),
  ).toBeVisible();
  await expect(section.getByRole("img", { name: /Reading calendar/ })).toBeVisible();
});

test("the reader header shows the flame once there is a streak", async ({ page }) => {
  await page.addInitScript(
    (a) => localStorage.setItem("lr:activity:v1", JSON.stringify(a)),
    {
      [daysAgo(0)]: 300,
      [daysAgo(1)]: 300,
    },
  );
  await page.goto("/read/alices-adventures-in-wonderland/1", {
    waitUntil: "networkidle",
  });
  await expect(page.getByRole("link", { name: /2-day reading streak/ })).toBeVisible();
});

/** Reads the "Pages 3–4 of 30" / "Page 4 of 17" status and returns [current, total]. */
async function pageStatus(page: import("@playwright/test").Page) {
  const text =
    (await page.getByRole("status").filter({ hasText: /Page/ }).first().textContent()) ??
    "";
  const nums = text.match(/\d+/g)!.map(Number);
  return { first: nums[0], total: nums[nums.length - 1], text };
}

const bookPrefs = (extra: object = {}) => ({ mode: "book", level: 2, ...extra });

test.describe("book view", () => {
  test("shows original and modern pages side by side and turns pages", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Two-page spreads are a desktop layout.");
    await page.addInitScript(
      (p) => localStorage.setItem("lr:prefs:v1", JSON.stringify(p)),
      bookPrefs(),
    );
    await page.goto("/read/alices-adventures-in-wonderland/1", {
      waitUntil: "networkidle",
    });

    const book = page.getByRole("region", { name: /Down the Rabbit-Hole/ });
    await expect(book.getByText("Original version")).toBeVisible();
    await expect(book.getByText("Modern version")).toBeVisible();
    expect((await pageStatus(page)).text).toMatch(/Pages 1–2 of/);

    // The slider only chooses the right-hand version: no Original option.
    const dock = page.locator("div.glass").last();
    await expect(dock.getByRole("button", { name: "Original" })).toHaveCount(0);
    await dock.getByRole("button", { name: "Contemporary" }).isDisabled();

    await page.keyboard.press("ArrowRight");
    expect((await pageStatus(page)).text).toMatch(/Pages 3–4 of/);
    // A leaf turns over the spine, then the finished spread stands alone.
    await expect(page.locator(".book-leaf-next")).toHaveCount(1);
    await expect(page.locator(".book-leaf")).toHaveCount(0);
    await page.keyboard.press("ArrowLeft");
    expect((await pageStatus(page)).text).toMatch(/Pages 1–2 of/);
    await expect(page.locator(".book-leaf-prev")).toHaveCount(1);
    await expect(page.locator(".book-leaf")).toHaveCount(0);

    // Clicking the outer edge of the right page turns forward; the left edge of the left page, back.
    const pages = page.locator(".book-page");
    const right = (await pages.nth(1).boundingBox())!;
    await page.mouse.click(right.x + right.width * 0.9, right.y + right.height / 2);
    expect((await pageStatus(page)).text).toMatch(/Pages 3–4 of/);
    const left = (await pages.nth(0).boundingBox())!;
    await page.mouse.click(left.x + left.width * 0.1, left.y + left.height / 2);
    expect((await pageStatus(page)).text).toMatch(/Pages 1–2 of/);
  });

  for (const path of [
    "/read/alices-adventures-in-wonderland/2",
    "/read/moby-dick/1", // very long paragraphs
  ])
    test(`every word of ${path} appears, and no page overflows`, async ({
      page,
      isMobile,
    }) => {
      // The words the scrolling reader shows are the reference.
      await page.goto(path, {
        waitUntil: "networkidle",
      });
      await page.evaluate(() =>
        localStorage.setItem("lr:prefs:v1", JSON.stringify({ mode: "scroll", level: 0 })),
      );
      await page.reload({ waitUntil: "networkidle" });
      const expected = (await page.locator('[data-src="original"]').allTextContents())
        .join(" ")
        .split(/\s+/)
        .filter(Boolean);
      expect(expected.length).toBeGreaterThan(500);

      await page.evaluate(
        (p) => localStorage.setItem("lr:prefs:v1", JSON.stringify(p)),
        bookPrefs(),
      );
      await page.reload({ waitUntil: "networkidle" });
      await expect(
        page
          .getByRole("region", { name: /book/i })
          .or(page.locator(".book-page").first()),
      ).toBeVisible();

      const seen: string[] = [];
      const { total } = await pageStatus(page);
      const turns = isMobile ? total : Math.ceil(total / 2);
      for (let i = 0; i < turns; i++) {
        const pagesNow = await page.locator(".book-text").evaluateAll((els) =>
          els.map((el) => ({
            clipped: el.scrollHeight > el.clientHeight + 1,
            // On a spread, only the left page carries the original text.
            text: Array.from(el.querySelectorAll("p[data-p]")).map(
              (p) => p.textContent ?? "",
            ),
          })),
        );
        expect(
          pagesNow.every((p) => !p.clipped),
          `page set ${i + 1} overflows`,
        ).toBe(true);
        // Left page on desktop; the single page (original side) on mobile.
        seen.push(...pagesNow[0].text);
        if (i < turns - 1) {
          await page.keyboard.press("ArrowRight");
          // Let the page finish turning so only the open pages are in the document.
          await expect(page.locator(".book-leaf")).toHaveCount(0);
        }
      }
      // On mobile the single page defaults to the modern text, so only compare originals on desktop.
      if (!isMobile) {
        const got = seen.join(" ").split(/\s+/).filter(Boolean);
        expect(got.join(" ")).toBe(expected.join(" "));
      }
    });

  test("a chapter with no modern version flows across both pages", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Two-page spreads are a desktop layout.");
    await page.addInitScript(
      (p) => localStorage.setItem("lr:prefs:v1", JSON.stringify(p)),
      bookPrefs(),
    );
    await page.goto("/read/pride-and-prejudice/2", { waitUntil: "networkidle" });
    await expect(page.getByText(/still being written/i)).toBeVisible();
    const texts = await page
      .locator(".book-text")
      .evaluateAll((els) => els.map((el) => el.querySelectorAll("p[data-p]").length));
    expect(texts).toHaveLength(2);
    expect(texts[0]).toBeGreaterThan(0);
    expect(texts[1]).toBeGreaterThan(0);
  });

  test("on a phone one page shows at a time with an Original / Modern switch", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "Phone layout");
    await page.addInitScript(
      (p) => localStorage.setItem("lr:prefs:v1", JSON.stringify(p)),
      bookPrefs(),
    );
    await page.goto("/read/alices-adventures-in-wonderland/1", {
      waitUntil: "networkidle",
    });
    await expect(page.locator(".book-page")).toHaveCount(1);
    const group = page.getByRole("group", { name: "Version" });
    await expect(group.getByRole("button", { name: "Modern" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const modernText = await page.locator(".book-text p[data-p]").first().textContent();
    await group.getByRole("button", { name: "Original" }).click();
    await expect(group.getByRole("button", { name: "Original" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await page.locator(".book-text p[data-p]").first().textContent()).not.toBe(
      modernText,
    );

    await page.keyboard.press("ArrowRight");
    expect((await pageStatus(page)).first).toBe(2);
  });

  test("the toggle switches between book and scroll and remembers the choice", async ({
    page,
  }) => {
    await page.goto("/read/alices-adventures-in-wonderland/1", {
      waitUntil: "networkidle",
    });
    // Book is the default.
    await expect(page.locator(".book-page").first()).toBeVisible();
    await page.getByRole("button", { name: "Switch to scrolling view" }).click();
    await expect(page.locator(".book-page")).toHaveCount(0);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".book-page")).toHaveCount(0);
    await page.getByRole("button", { name: "Switch to book view" }).click();
    await expect(page.locator(".book-page").first()).toBeVisible();
  });

  /** Selects all the text of the first paragraph on the given page (left = original). */
  const selectOn = (page: Page, side: "left" | "right") =>
    page.evaluate((cls) => {
      const p = document.querySelector(`.${cls} .book-text p[data-p]`)!;
      const r = document.createRange();
      r.selectNodeContents(p);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(r);
    }, `book-page-${side}`);

  test("highlights, notes and bookmarks work on book pages", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Selection gestures are checked on desktop.");
    await page.goto("/read/alices-adventures-in-wonderland/1", {
      waitUntil: "networkidle",
    });
    await expect(page.locator(".book-page-left")).toBeVisible();

    await selectOn(page, "left");
    await page.getByRole("button", { name: "Highlight Ember" }).click();
    const mark = page.locator(".book-page-left mark").first();
    await expect(mark).toBeVisible();

    // Clicking a highlight opens its note instead of turning the page.
    const before = (await pageStatus(page)).text;
    await mark.click();
    await expect(page.getByRole("dialog").getByText("Your note")).toBeVisible();
    expect((await pageStatus(page)).text).toBe(before);
    await page.getByPlaceholder("Add a thought…").fill("a thought");
    await page.getByPlaceholder("Add a thought…").blur();

    // The highlight survives a reload, with its note.
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".book-page-left mark").first()).toBeVisible();

    // A bookmark marks the page.
    const ribbon = page.getByRole("button", { name: "Bookmark this page" });
    await ribbon.click();
    await expect(
      page.getByRole("button", { name: "Remove bookmark from this page" }),
    ).toBeVisible();
    await page.reload({ waitUntil: "networkidle" });
    await expect(
      page.getByRole("button", { name: "Remove bookmark from this page" }),
    ).toBeVisible();
  });

  test("a selected passage on a book page becomes a quote card or an explanation", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Selection gestures are checked on desktop.");
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
    await expect(page.locator(".book-page-left")).toBeVisible();

    await selectOn(page, "left");
    await page.getByRole("button", { name: "Card", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Make a quote card" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await selectOn(page, "right");
    await page.getByRole("button", { name: "Explain" }).click();
    await expect(page.getByRole("dialog", { name: "The quill" })).toContainText(
      "A mocked plain-English reading.",
      { timeout: 15_000 },
    );
  });

  test("glossary words on the original page open their meaning", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Checked on desktop.");
    await page.goto("/read/pride-and-prejudice/1", { waitUntil: "networkidle" });
    const term = page.locator(".book-page-left .book-text button").first();
    // The library has no glossary entries yet; the check applies once there are some.
    test.skip((await term.count()) === 0, "No glossary terms on this page.");
    await expect(term).toBeVisible();
    await term.click();
    await expect(page.locator("[data-popover]")).toBeVisible();
  });

  test("reading aloud turns the pages to follow the voice", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Checked on desktop.");
    await page.addInitScript(() => {
      class FakeUtterance {
        text: string;
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      }
      let queue: FakeUtterance[] = [];
      let timer: ReturnType<typeof setTimeout> | undefined;
      const pump = () => {
        const u = queue.shift();
        if (!u) return;
        u.onstart?.();
        timer = setTimeout(() => {
          u.onend?.();
          pump();
        }, 40);
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
    await page.goto("/read/alices-adventures-in-wonderland/2", {
      waitUntil: "networkidle",
    });
    await expect(page.locator(".book-page-left")).toBeVisible();
    expect((await pageStatus(page)).first).toBe(1);
    await page.getByRole("button", { name: "Read aloud" }).click();
    await expect
      .poll(async () => (await pageStatus(page)).first, { timeout: 15_000 })
      .toBeGreaterThan(1);
  });
});
