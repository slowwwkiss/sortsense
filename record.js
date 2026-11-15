// Record the SortSense demo video segments in headless Chromium.
// Logs payoff timestamps to video/raw/timings.json so the build can skip
// the loading wait and start each clip right when the result appears.
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const APP = path.join(ROOT, "app");
const RAW = path.join(ROOT, "video", "raw");
fs.mkdirSync(RAW, { recursive: true });
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".bin": "application/octet-stream", ".json": "application/json" };

const server = http.createServer((req, res) => {
  const p = path.join(APP, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  const f = p.endsWith("/") ? path.join(p, "index.html") : p;
  if (!f.startsWith(APP) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const timings = {};

(async () => {
  await new Promise((r) => server.listen(8322, r));
  const browser = await chromium.launch({ args: ["--no-sandbox"] });

  async function record(name, fn) {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: RAW, size: { width: 1280, height: 720 } },
    });
    const page = await ctx.newPage();
    const t0 = Date.now();
    const at = () => (Date.now() - t0) / 1000;
    await page.goto("http://localhost:8322/index.html", { waitUntil: "load" });
    await sleep(1200);
    const marks = await fn(page, at);
    await sleep(500);
    const video = page.video();
    await ctx.close();
    const src = await video.path();
    const dest = path.join(RAW, name + ".webm");
    fs.renameSync(src, dest);
    timings[name] = marks;
    console.log("recorded", name, fs.statSync(dest).size, "bytes, marks:", JSON.stringify(marks));
  }

  await record("seg-nutella", async (page, at) => {
    await page.click("text=Try: Nutella");
    await page.waitForSelector("#resultCard:not(.hidden)", { timeout: 30000 });
    const result = at();
    await page.locator("#resultCard").scrollIntoViewIfNeeded();
    await sleep(8000);
    return { result };
  });

  await record("seg-pringles", async (page, at) => {
    await page.click("text=Try: Pringles");
    await page.waitForSelector("#resultCard:not(.hidden)", { timeout: 30000 });
    const result = at();
    await page.locator("#resultCard").scrollIntoViewIfNeeded();
    await sleep(8000);
    return { result };
  });

  await record("seg-photo", async (page, at) => {
    await page.click("text=Photo check");
    await page.setInputFiles("#photoInput", path.join(ROOT, "tools/test-bottle.jpg"));
    await page.waitForSelector("#photoResults .pred", { timeout: 120000 });
    const pred = at();
    await page.locator("#photoResults").scrollIntoViewIfNeeded();
    await sleep(8000);
    return { pred };
  });

  await record("seg-guide", async (page, at) => {
    await page.click("text=What goes where");
    await page.fill("#guideSearch", "battery");
    const search = at();
    await sleep(4000);
    await page.click("text=Scan a barcode");
    await page.click("text=Try: Coca-Cola");
    await page.waitForSelector("#resultCard:not(.hidden)", { timeout: 30000 });
    await page.click("#logBtn");
    await sleep(1500);
    await page.click("text=My impact");
    await sleep(6000);
    return { search };
  });

  await browser.close();
  server.close();
  fs.writeFileSync(path.join(RAW, "timings.json"), JSON.stringify(timings, null, 2));
  console.log("all segments recorded");
})().catch((e) => { console.error("RECORD CRASH:", e.message); server.close(); process.exit(1); });
