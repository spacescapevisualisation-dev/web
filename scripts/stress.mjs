// Browser stress harness: N randomized user sessions against the local site.
// Each session picks a viewport, clicks through the UI like a real visitor,
// and we record every console error, page error, dialog, and failed request.
import { chromium } from "playwright";

const BASE = process.env.TARGET || "http://localhost:3000/";
const SESSIONS = parseInt(process.env.SESSIONS || "500", 10);
const PARALLEL = parseInt(process.env.PARALLEL || "8", 10);

const VIEWPORTS = [
  { name: "desktop", width: 1512, height: 945 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "tablet", width: 834, height: 1112, isMobile: true, hasTouch: true },
  { name: "phone", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "phone-small", width: 360, height: 740, isMobile: true, hasTouch: true },
];

const issues = new Map(); // message -> { count, sample }
let completed = 0, failedSessions = 0;

function record(kind, msg, ctx) {
  const key = `${kind}: ${msg}`.slice(0, 300);
  const cur = issues.get(key) || { count: 0, ctx };
  cur.count++;
  issues.set(key, cur);
}

const rand = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rand(a.length)];

async function act(page, vp) {
  const actions = [
    // scroll around (momentum feed)
    async () => {
      for (let i = 0; i < 3 + rand(5); i++) {
        await page.mouse.wheel(0, 300 + rand(900));
        await page.waitForTimeout(80 + rand(200));
      }
    },
    // open a random project tile, wheel through it, close
    async () => {
      const covers = page.locator(".p-cover");
      const n = await covers.count();
      if (!n) return;
      const c = covers.nth(rand(n));
      await c.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await c.click({ force: true });
      await page.waitForTimeout(500 + rand(600));
      // wheel inside the open strip (horizontal drive)
      await page.mouse.wheel(0, 400 + rand(1200));
      await page.waitForTimeout(200 + rand(400));
      if (rand(2)) {
        await page.keyboard.press("Escape");
      } else {
        const close = page.locator(".p-item.open .c-close");
        if (await close.count()) await close.click({ force: true }).catch(() => {});
      }
      await page.waitForTimeout(300);
    },
    // drag the open strip
    async () => {
      const open = page.locator(".p-item.open .p-strip");
      if (!(await open.count())) {
        const covers = page.locator(".p-cover");
        const n = await covers.count();
        if (!n) return;
        const c = covers.nth(rand(n));
        await c.scrollIntoViewIfNeeded();
        await c.click({ force: true });
        await page.waitForTimeout(600);
      }
      const strip = page.locator(".p-item.open .p-strip").first();
      if (!(await strip.count())) return;
      const box = await strip.boundingBox();
      if (!box) return;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 - (100 + rand(400)), box.y + box.height / 2, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(200);
    },
    // category tabs / index panel (desktop) or filter panel (mobile)
    async () => {
      if (vp.width > 860) {
        const tabs = page.locator(".catbar .cat");
        const n = await tabs.count();
        if (!n) return;
        await tabs.nth(rand(n)).click({ force: true });
        await page.waitForTimeout(400 + rand(400));
        const items = page.locator(".cat-index.open .ci-item");
        const m = await items.count();
        if (m && rand(2)) {
          await items.nth(rand(m)).click({ force: true });
          await page.waitForTimeout(700);
        } else {
          await page.keyboard.press("Escape");
        }
      } else {
        const btn = page.locator(".fbtn");
        if (!(await btn.count())) return;
        await btn.click({ force: true });
        await page.waitForTimeout(400);
        const cats = page.locator(".fpanel.open .fp-cat");
        const n = await cats.count();
        if (n) await cats.nth(rand(n)).click({ force: true });
        await page.waitForTimeout(250);
        const projs = page.locator(".fpanel.open .fp-proj");
        const m = await projs.count();
        if (m && rand(2)) {
          await projs.nth(rand(m)).click({ force: true });
        } else {
          await page.keyboard.press("Escape");
        }
        await page.waitForTimeout(400);
      }
    },
    // side menu via logo
    async () => {
      const logo = page.locator("button.logo");
      if (!(await logo.count())) return;
      await logo.click({ force: true });
      await page.waitForTimeout(400);
      const links = page.locator(".side.open .side-link");
      const n = await links.count();
      if (n && rand(2)) {
        await links.nth(rand(n)).click({ force: true });
      } else {
        await page.keyboard.press("Escape");
      }
      await page.waitForTimeout(400);
    },
    // keyboard-only user: tab around and hit Enter
    async () => {
      for (let i = 0; i < 4 + rand(6); i++) await page.keyboard.press("Tab");
      if (rand(2)) await page.keyboard.press("Enter");
      await page.waitForTimeout(300);
      await page.keyboard.press("Escape");
    },
    // rapid double/triple clicking (impatient user)
    async () => {
      const covers = page.locator(".p-cover");
      const n = await covers.count();
      if (!n) return;
      const c = covers.nth(rand(n));
      await c.scrollIntoViewIfNeeded();
      await c.click({ force: true, clickCount: 2 });
      await page.waitForTimeout(120);
      await c.click({ force: true });
      await page.waitForTimeout(300);
    },
  ];
  const steps = 2 + rand(3);
  for (let i = 0; i < steps; i++) await pick(actions)();
}

async function session(browser) {
  const vp = pick(VIEWPORTS);
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: !!vp.isMobile,
    hasTouch: !!vp.hasTouch,
    reducedMotion: rand(10) === 0 ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") record("console", m.text(), vp.name);
  });
  page.on("pageerror", (e) => record("pageerror", e.message, vp.name));
  page.on("requestfailed", (r) => {
    const f = r.failure()?.errorText || "";
    if (f.includes("ERR_ABORTED")) return; // normal for cancelled nav/prefetch
    record("requestfailed", `${f} ${r.url()}`.slice(0, 200), vp.name);
  });
  page.on("dialog", (d) => { record("dialog", d.message(), vp.name); d.dismiss().catch(() => {}); });
  try {
    const resp = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 20000 });
    if (!resp || resp.status() >= 400) record("http", `status ${resp?.status()}`, vp.name);
    await page.waitForTimeout(400);
    await act(page, vp);
  } catch (e) {
    failedSessions++;
    record("session-crash", e.message.split("\n")[0], vp.name);
  } finally {
    await context.close();
    completed++;
    if (completed % 50 === 0) console.log(`progress: ${completed}/${SESSIONS} sessions`);
  }
}

const browser = await chromium.launch();
let next = 0;
async function worker() {
  while (next < SESSIONS) {
    next++;
    await session(browser);
  }
}
const t0 = Date.now();
await Promise.all(Array.from({ length: PARALLEL }, worker));
await browser.close();

console.log(`\n==== STRESS REPORT ====`);
console.log(`sessions: ${completed}, crashed: ${failedSessions}, elapsed: ${((Date.now() - t0) / 1000).toFixed(0)}s`);
if (issues.size === 0) {
  console.log("NO ISSUES FOUND");
} else {
  for (const [k, v] of [...issues.entries()].sort((a, b) => b[1].count - a[1].count)) {
    console.log(`[x${v.count}] (${v.ctx}) ${k}`);
  }
}
