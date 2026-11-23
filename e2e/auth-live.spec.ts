import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end checks of email + password accounts against the real Supabase project.
 * Test users are created with the admin API (so no emails are sent) and always deleted afterwards.
 * Skipped automatically when Supabase keys are not configured, and on the mobile project.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  /* no env file */
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(
  URL && ANON && SERVICE && /^https:\/\/.+\.supabase\.co/.test(URL),
);

const PASSWORD = "Test-pass-12345!";
const stamp = Date.now();
const emailA = `lr-e2e-a-${stamp}@example.com`;
const emailB = `lr-e2e-b-${stamp}@example.com`;

let admin: SupabaseClient;
let userA = "";
let userB = "";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

async function cloudShelf(userId: string) {
  const { data } = await admin
    .from("user_books")
    .select("status,books(slug)")
    .eq("user_id", userId);
  return (data ?? []).map(
    (r) => `${(r.books as unknown as { slug: string }).slug}:${r.status}`,
  );
}

test.describe.serial("email and password accounts (live Supabase)", () => {
  test.skip(!configured, "Supabase is not configured");
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test.beforeAll(async () => {
    admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } });
    const a = await admin.auth.admin.createUser({
      email: emailA,
      password: PASSWORD,
      email_confirm: true,
    });
    const b = await admin.auth.admin.createUser({
      email: emailB,
      password: PASSWORD,
      email_confirm: true,
    });
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
    userA = a.data.user!.id;
    userB = b.data.user!.id;
  });

  test.afterAll(async () => {
    if (!admin) return;
    for (const id of [userA, userB]) if (id) await admin.auth.admin.deleteUser(id);
  });

  test("a wrong password shows an error and keeps you on the sign-in page", async ({
    page,
  }) => {
    await signIn(page, emailA, "definitely-wrong-password");
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("signing in redirects to the library and guest data merges into the account", async ({
    page,
  }) => {
    // Guest activity first.
    await page.goto("/books/dracula", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Want to read" }).click();

    await signIn(page, emailA, PASSWORD);
    await expect(page).toHaveURL(/\/library/, { timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();

    // The shelf entry reaches the cloud within a few seconds (sync is debounced).
    await expect
      .poll(() => cloudShelf(userA), { timeout: 20_000 })
      .toContain("dracula:want");
  });

  test("signed-in visitors are sent away from the sign-in page", async ({ page }) => {
    await signIn(page, emailA, PASSWORD);
    await expect(page).toHaveURL(/\/library/, { timeout: 20_000 });
    await page.goto("/login");
    await expect(page).toHaveURL(/\/library/);
  });

  test("signing out clears this browser, keeps the cloud copy, and signing back in restores it", async ({
    page,
  }) => {
    await signIn(page, emailA, PASSWORD);
    await expect(page).toHaveURL(/\/library/, { timeout: 20_000 });
    await expect(page.getByText("Dracula").first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible({
      timeout: 15_000,
    });

    const local = await page.evaluate(() => localStorage.getItem("lr:shelf:v1"));
    expect(JSON.parse(local ?? "{}")).toEqual({});

    // Clearing the browser must never delete the account's data.
    await page.waitForTimeout(3000);
    expect(await cloudShelf(userA)).toContain("dracula:want");

    await signIn(page, emailA, PASSWORD);
    await expect(page).toHaveURL(/\/library/, { timeout: 20_000 });
    await expect(page.getByText("Dracula").first()).toBeVisible({ timeout: 20_000 });
  });

  test("reading days sync to the account, survive sign-out and come back", async ({
    page,
  }) => {
    const dayKey = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const today = dayKey(0);
    const yesterday = dayKey(1);
    const cloudDays = async () => {
      const { data, error } = await admin
        .from("reading_days")
        .select("day,words")
        .eq("user_id", userA);
      expect(error, "reading_days table should exist").toBeNull();
      return Object.fromEntries((data ?? []).map((r) => [r.day, r.words]));
    };

    // Reading done as a guest...
    await page.goto("/library", { waitUntil: "networkidle" });
    await page.evaluate(
      ([t, y]) =>
        localStorage.setItem("lr:activity:v1", JSON.stringify({ [t]: 400, [y]: 300 })),
      [today, yesterday],
    );

    // ...merges into the account at sign-in.
    await signIn(page, emailA, PASSWORD);
    await expect(page).toHaveURL(/\/library/, { timeout: 20_000 });
    await expect.poll(cloudDays, { timeout: 20_000 }).toMatchObject({
      [today]: 400,
      [yesterday]: 300,
    });
    const rhythm = page.getByRole("region", { name: "Reading rhythm" });
    await expect(
      rhythm.getByText("Day streak").locator("..").getByText("2", { exact: true }),
    ).toBeVisible();

    // Signing out wipes this browser but never the cloud copy.
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible({
      timeout: 15_000,
    });
    expect(
      JSON.parse(
        (await page.evaluate(() => localStorage.getItem("lr:activity:v1"))) ?? "{}",
      ),
    ).toEqual({});
    await page.waitForTimeout(3000);
    expect(await cloudDays()).toMatchObject({ [today]: 400, [yesterday]: 300 });

    // Signing back in restores the streak from the cloud.
    await signIn(page, emailA, PASSWORD);
    await expect(page).toHaveURL(/\/library/, { timeout: 20_000 });
    await expect(
      page
        .getByRole("region", { name: "Reading rhythm" })
        .getByText("Day streak")
        .locator("..")
        .getByText("2", { exact: true }),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("reading days are private to their owner", async () => {
    const asA = createClient(URL!, ANON!, { auth: { persistSession: false } });
    expect(
      (await asA.auth.signInWithPassword({ email: emailA, password: PASSWORD })).error,
    ).toBeNull();
    const seeded = await admin
      .from("reading_days")
      .insert({ user_id: userB, day: "2026-01-02", words: 999 });
    expect(seeded.error).toBeNull();

    const rows = await asA.from("reading_days").select("user_id");
    expect(rows.error).toBeNull();
    expect((rows.data ?? []).every((r) => r.user_id === userA)).toBe(true);

    const forged = await asA
      .from("reading_days")
      .insert({ user_id: userB, day: "2026-01-03", words: 1 });
    expect(forged.error).not.toBeNull();
  });

  test("one account can never read another account's data", async () => {
    // Give user B a private row, then try to read it as user A.
    const { data: book } = await admin
      .from("books")
      .select("id")
      .eq("slug", "frankenstein")
      .single();
    const ins = await admin
      .from("user_books")
      .insert({ user_id: userB, book_id: book!.id, status: "reading" });
    expect(ins.error).toBeNull();

    const asA = createClient(URL!, ANON!, { auth: { persistSession: false } });
    const login = await asA.auth.signInWithPassword({
      email: emailA,
      password: PASSWORD,
    });
    expect(login.error).toBeNull();

    const rows = await asA.from("user_books").select("user_id");
    expect(rows.error).toBeNull();
    expect((rows.data ?? []).every((r) => r.user_id === userA)).toBe(true);

    // Nor can A write into B's shelf.
    const forged = await asA
      .from("user_books")
      .insert({ user_id: userB, book_id: book!.id, status: "finished" });
    expect(forged.error).not.toBeNull();
  });

  test("the auth callback rejects bad codes and never redirects off-site", async ({
    request,
  }) => {
    const res = await request.get(
      "/auth/callback?code=not-a-real-code&next=//evil.example",
      { maxRedirects: 0 },
    );
    expect([302, 307]).toContain(res.status());
    const location = res.headers()["location"] ?? "";
    expect(location).toContain("/login?error=auth");
    expect(location).not.toContain("evil.example");
  });
});
