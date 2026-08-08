// Verifies the mobile swipe-discovery UX: after opening a project the strip
// peeks sideways, the "Swipe →" chip shows, and a real swipe dismisses it.
import { chromium } from "playwright";

const BASE = process.env.TARGET || "http://localhost:3000/";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

// skip the intro curtain so the tap lands on the cover, not the overlay
await page.addInitScript(() => sessionStorage.setItem("ss-intro-seen", "1"));
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);

const cover = page.locator(".p-cover").first();
await cover.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await cover.click();
await page.waitForSelector(".p-item.open .p-strip", { timeout: 5000 });

// sample scrollLeft through the slide window (unfold .78s + delay .95s + .8s slide)
let peak = 0;
const t0 = Date.now();
while (Date.now() - t0 < 3200) {
  const sl = await page.evaluate(() => document.querySelector(".p-item.open .p-strip")?.scrollLeft ?? 0);
  peak = Math.max(peak, sl);
  await page.waitForTimeout(80);
}
// the strip must STAY parked at the offset, not return to 0
const settled = await page.evaluate(() => document.querySelector(".p-item.open .p-strip")?.scrollLeft ?? -1);

const hintVisible = await page.evaluate(() => {
  const h = document.querySelector(".p-item.open .swipe-hint");
  return h ? parseFloat(getComputedStyle(h).opacity) > 0.5 : false;
});

// now swipe for real and confirm the chip goes away
await page.evaluate(() => {
  const s = document.querySelector(".p-item.open .p-strip");
  if (s) s.scrollLeft = 200;
});
await page.waitForTimeout(700);
const hintGone = await page.evaluate(() => {
  const h = document.querySelector(".p-item.open .swipe-hint");
  return h ? parseFloat(getComputedStyle(h).opacity) < 0.1 : false;
});
const learned = await page.evaluate(() => sessionStorage.getItem("ss-swipe-known"));

console.log(`slide max scrollLeft: ${Math.round(peak)}px (want ~144)`);
console.log(`parked at: ${settled}px (want ~144, must NOT return to 0)`);
console.log(`hint visible while parked: ${hintVisible}`);
console.log(`hint hidden after swipe: ${hintGone}`);
console.log(`session learned flag: ${learned}`);
console.log(`page errors: ${errors.length ? errors.join(" | ") : "none"}`);

const pass = peak > 130 && settled >= 130 && settled <= 158 && hintVisible && hintGone && learned === "1" && errors.length === 0;
console.log(pass ? "PASS" : "FAIL");
await browser.close();
process.exit(pass ? 0 : 1);
