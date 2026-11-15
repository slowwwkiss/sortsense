// End-to-end smoke test for the SortSense app.
// Serves app/ over HTTP, drives it in headless Chromium, asserts each flow.
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const APP = path.join(__dirname, "app");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg" };

const server = http.createServer((req, res) => {
  const p = path.join(APP, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  const f = p.endsWith("/") ? path.join(p, "index.html") : p;
  if (!f.startsWith(APP) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || "" });
  console.log((ok ? "PASS " : "FAIL ") + name + (detail ? " — " + detail : ""));
}

(async () => {
  await new Promise((r) => server.listen(8321, r));
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  const pageErrors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => pageErrors.push("pageerror: " + e.message));

  await page.goto("http://localhost:8321/index.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  check("page loads, hero visible", await page.locator("h1").isVisible());
  check("no console errors on load", errors.length === 0, errors.slice(0, 3).join(" | "));
  check("TF.js loads from local vendor files", await page.evaluate(() => typeof tf !== "undefined" && typeof mobilenet !== "undefined"));

  // 1. Barcode: Nutella (live OFF or bundled fallback)
  await page.click("text=Try: Nutella");
  await page.waitForSelector("#resultCard:not(.hidden)", { timeout: 20000 });
  const nutella = await page.locator("#resName").textContent();
  const parts = await page.locator("#resParts").textContent();
  check("Nutella lookup shows product", /nutella/i.test(nutella), nutella);
  check("Nutella parts include glass", /glass/i.test(parts), parts.slice(0, 120));
  const src = await page.locator("#resSrc").textContent();
  check("Nutella source is stated", /Open Food Facts|Built-in/i.test(src), src);
  check("Nutella verdict chips present", (await page.locator("#resVerdicts .verdict").count()) >= 1);
  await page.screenshot({ path: "tools/shot-nutella.png" });

  // 2. Barcode: Pringles (mixed packaging)
  await page.click("text=Try: Pringles");
  await page.waitForTimeout(1500);
  const overall = await page.locator("#resOverall").textContent();
  check("Pringles shows mixed-packaging warning", /mixed packaging/i.test(overall), overall.slice(0, 100));

  // 3. Barcode: unknown code
  await page.fill("#barcode", "0000000000000");
  await page.click("#lookupBtn");
  await page.waitForTimeout(2500);
  const st = await page.locator("#scanStatus").textContent();
  check("unknown barcode handled gracefully", /no product found/i.test(st), st);

  // 4. Guide search
  await page.click("text=What goes where");
  await page.fill("#guideSearch", "battery");
  await page.waitForTimeout(400);
  const guideTxt = await page.locator("#guideList").textContent();
  check("guide search finds battery", /battery/i.test(guideTxt) && /drop off/i.test(guideTxt), guideTxt.slice(0, 100));
  await page.fill("#guideSearch", "zzzznope");
  await page.waitForTimeout(400);
  check("guide empty state", /nothing matches/i.test(await page.locator("#guideList").textContent()));

  // 5. Photo check with a real photo (bottle) if fixture exists, else generated image
  await page.click("text=Photo check");
  const fixture = fs.existsSync(path.join(__dirname, "tools/test-bottle.jpg")) ? path.join(__dirname, "tools/test-bottle.jpg") : null;
  if (fixture) {
    await page.setInputFiles("#photoInput", fixture);
    await page.waitForSelector("#photoResults .pred", { timeout: 90000 });
    const preds = await page.locator("#photoResults").textContent();
    check("photo check returns predictions", preds.length > 20, preds.slice(0, 120));
    await page.screenshot({ path: "tools/shot-photo.png" });
  } else {
    console.log("SKIP photo check (no fixture yet)");
  }

  // 6. Log + impact
  await page.click("text=Scan a barcode");
  await page.click("text=Try: Coca-Cola");
  await page.waitForSelector("#resultCard:not(.hidden)", { timeout: 20000 });
  await page.click("#logBtn");
  await page.waitForTimeout(400);
  await page.click("text=My impact");
  const items = await page.locator("#stItems").textContent();
  check("impact log counts 1 item", items.trim() === "1", "items=" + items);
  const co2 = await page.locator("#stCo2").textContent();
  check("impact shows CO2 estimate", /g|kg/.test(co2), co2);
  await page.screenshot({ path: "tools/shot-impact.png" });

  // NOTE: in this VM, headless Chromium cannot reach external hosts
  // (egress proxy blocks browser traffic; curl works). The app is built
  // to degrade gracefully: live OFF lookup falls back to verified bundled
  // data. So "Failed to load resource" console noise is expected HERE and
  // does not count as a failure; uncaught page errors do.
  check("no uncaught page errors at end", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));
  console.log("note: resource load errors (expected in this VM only): " + errors.length);

  await browser.close();
  server.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH:", e.message); server.close(); process.exit(2); });
