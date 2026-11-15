// SortSense app logic. No account, no tracking, no data leaves the browser
// except the Open Food Facts lookup itself.
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // ---------- tabs ----------
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      $("panel-" + btn.dataset.tab).classList.add("active");
    });
  });

  // ---------- material helpers ----------
  function materialFor(text) {
    const t = (text || "").toLowerCase();
    for (const [kw, key] of MATERIAL_KEYWORDS) {
      if (t.includes(kw)) return key;
    }
    return "unknown";
  }

  function verdictChip(key) {
    const m = MATERIAL_INFO[key];
    const v = VERDICT_META[m.verdict];
    return `<span class="verdict ${v.cls}">${v.label}</span>`;
  }

  // ---------- barcode lookup ----------
  const DEMO_BARCODES = [
    ["3017620422003", "Nutella"],
    ["5449000000996", "Coca-Cola"],
    ["3068320055008", "Evian water"],
    ["5053990104825", "Pringles"],
    ["5000157023481", "Heinz beans"],
  ];
  const chipsBox = $("demoChips");
  DEMO_BARCODES.forEach(([code, label]) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.textContent = "Try: " + label;
    b.addEventListener("click", () => { $("barcode").value = code; lookup(); });
    chipsBox.appendChild(b);
  });

  let currentResult = null; // { name, parts, image }

  function partsFromOff(p) {
    const parts = [];
    const text = (p.packaging || "").trim();
    if (text && text.toLowerCase() !== "unknown packaging") {
      const segs = text.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      for (const seg of segs) {
        const m = seg.match(/^([^:()]+):\s*(.+)$/);
        const partName = m ? m[1].trim() : "Packaging";
        const rest = m ? m[2] : seg;
        const key = materialFor(seg);
        if (key === "unknown" && /^(unknown|n\/a|none)/i.test(seg)) continue;
        parts.push({ part: cap(partName), material: key, weightKg: 0 });
      }
    }
    if (parts.length === 0 && Array.isArray(p.packaging_tags)) {
      for (const tag of p.packaging_tags) {
        const clean = String(tag).replace(/^[a-z]{2}:/, "").replace(/-/g, " ");
        const key = materialFor(clean);
        if (key !== "unknown") parts.push({ part: cap(clean), material: key, weightKg: 0 });
      }
    }
    return parts;
  }

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  async function fetchOff(code) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    try {
      const r = await fetch("https://world.openfoodfacts.org/api/v0/product/" + code + ".json", { signal: ctrl.signal });
      return await r.json();
    } finally { clearTimeout(t); }
  }

  async function lookup() {
    const code = $("barcode").value.replace(/\D/g, "");
    if (!code) { setStatus("Type a barcode number first.", true); return; }
    $("lookupBtn").disabled = true;
    setStatus("Looking it up...");
    $("resultCard").classList.add("hidden");
    try {
      let data = null;
      try { data = await fetchOff(code); } catch (e) { data = null; }
      const bundled = BUNDLED_PRODUCTS[code];
      let name = null, parts = [], image = null, source = null;
      if (data && data.status === 1 && data.product) {
        const p = data.product;
        name = p.product_name || p.product_name_en || null;
        parts = partsFromOff(p);
        image = p.image_url || p.image_front_url || null;
        if (parts.length > 0) source = "Open Food Facts, live lookup";
      }
      if (parts.length === 0 && bundled) {
        name = bundled.name;
        parts = bundled.parts.map((x) => ({ ...x }));
        source = bundled.source;
      }
      if (!name && data && data.status === 1 && data.product) {
        name = "Unnamed product";
      }
      if (!name) {
        setStatus("No product found for that barcode. Try one of the demo products, or search the guide below.", true);
        return;
      }
      if (parts.length === 0) {
        parts = [{ part: "Packaging", material: "unknown", weightKg: 0 }];
        source = source || "Open Food Facts, live lookup";
      }
      currentResult = { name, parts, image };
      renderResult(name, parts, image, source);
      setStatus("");
    } finally {
      $("lookupBtn").disabled = false;
    }
  }

  function setStatus(msg, isErr) {
    const el = $("scanStatus");
    el.textContent = msg;
    el.classList.toggle("error", !!isErr);
  }

  function renderResult(name, parts, image, source) {
    $("resName").textContent = name;
    const img = $("resImg");
    if (image) { img.src = image; img.classList.remove("hidden"); }
    else img.classList.add("hidden");
    const verdicts = [...new Set(parts.map((p) => MATERIAL_INFO[p.material].verdict))];
    $("resVerdicts").innerHTML = verdicts.map((v) => {
      const meta = VERDICT_META[v];
      return `<span class="verdict ${meta.cls}">${meta.label}</span>`;
    }).join("");
    $("resSrc").textContent = "Source: " + source;
    $("resParts").innerHTML = parts.map((p) => {
      const m = MATERIAL_INFO[p.material];
      return `<div class="part">
        <span class="pname">${esc(p.part)} &middot; ${m.label}</span> ${verdictChip(p.material)}
        <p>${m.note} Bin: <strong>${m.bin}</strong>.</p>
      </div>`;
    }).join("");
    const bad = parts.filter((p) => ["trash", "check"].includes(MATERIAL_INFO[p.material].verdict));
    const good = parts.filter((p) => ["recycle", "compost"].includes(MATERIAL_INFO[p.material].verdict));
    const ov = $("resOverall");
    if (bad.length === 0) {
      ov.classList.remove("mixed");
      ov.textContent = "Good news: every part of this can be recycled or composted. Split the parts up and bin them as shown.";
    } else if (good.length === 0) {
      ov.classList.add("mixed");
      ov.textContent = "Heads up: nothing here is recyclable in most cities. It goes in the trash, or to a drop off point for the special parts.";
    } else {
      ov.classList.add("mixed");
      ov.textContent = "Mixed packaging: split it apart. Recycle the good parts, trash the rest. This is the kind of pack that trips most people up.";
    }
    $("resultCard").classList.remove("hidden");
    $("resultCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  $("lookupBtn").addEventListener("click", lookup);
  $("barcode").addEventListener("keydown", (e) => { if (e.key === "Enter") lookup(); });

  // ---------- camera barcode scan ----------
  let camStream = null, camTimer = null;
  const camBtn = $("camBtn");
  if (!("BarcodeDetector" in window)) {
    camBtn.disabled = true;
    camBtn.title = "Barcode camera scanning is not supported in this browser. Type the number instead.";
  }
  camBtn.addEventListener("click", async () => {
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    } catch (e) {
      setStatus("Camera is not available. Type the barcode number instead.", true);
      return;
    }
    $("camBox").classList.remove("hidden");
    $("cam").srcObject = camStream;
    setStatus("Point the camera at a barcode. Scanning...");
    let detector = null;
    try { detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] }); }
    catch (e) { detector = null; }
    if (!detector) { setStatus("Barcode detection is not supported here. Type the number instead.", true); stopCam(); return; }
    const tick = async () => {
      if (!camStream) return;
      try {
        const codes = await detector.detect($("cam"));
        if (codes.length > 0) {
          $("barcode").value = codes[0].rawValue;
          stopCam();
          lookup();
          return;
        }
      } catch (e) { /* keep trying */ }
      camTimer = setTimeout(tick, 400);
    };
    tick();
  });
  function stopCam() {
    if (camTimer) clearTimeout(camTimer);
    if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; }
    $("camBox").classList.add("hidden");
    const v = $("cam"); if (v.srcObject) v.srcObject = null;
  }
  $("camStop").addEventListener("click", () => { stopCam(); setStatus(""); });

  // ---------- photo check ----------
  let modelPromise = null;
  function loadModel() {
    if (!modelPromise) {
      modelPromise = mobilenet.load({ version: 2, alpha: 1.0, modelUrl: "vendor/mobilenet/model.json" });
    }
    return modelPromise;
  }
  $("photoInput").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const img = $("photoPreview");
    img.src = URL.createObjectURL(file);
    img.classList.remove("hidden");
    $("photoResults").innerHTML = "";
    $("photoStatus").textContent = "Loading the model...";
    try {
      const model = await loadModel();
      $("photoStatus").textContent = "Thinking...";
      await new Promise((res) => { if (img.complete) res(); else img.onload = res; });
      const preds = await model.classify(img);
      renderPhoto(preds);
      $("photoStatus").textContent = "Done. This is a best guess from a general image model, not a waste expert. Check the guide if you are unsure.";
    } catch (err) {
      $("photoStatus").textContent = "The model could not load. Check your connection and try again.";
    }
  });
  function renderPhoto(preds) {
    const box = $("photoResults");
    box.innerHTML = preds.slice(0, 3).map((p) => {
      const label = p.className.split(",")[0].toLowerCase();
      const hit = IMAGENET_MAP.find(([kw]) => label.includes(kw));
      const pct = Math.round(p.probability * 100);
      let body;
      if (hit) {
        const m = MATERIAL_INFO[hit[1]];
        body = `<div><strong>${esc(p.className)}</strong> ${verdictChip(hit[1])}</div>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="pct">${pct}% confident &middot; ${m.label}</div>
          <p style="margin:6px 0 0">${hit[2]}</p>`;
      } else {
        body = `<div><strong>${esc(p.className)}</strong></div>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="pct">${pct}% confident</div>
          <p style="margin:6px 0 0">Not sure what this is made of. Try the guide below.</p>`;
      }
      return `<div class="pred">${body}</div>`;
    }).join("");
  }

  // ---------- guide ----------
  let guideFilter = "all";
  const FILTERS = [
    ["all", "All"], ["recycle", "Recycle"], ["trash", "Trash"],
    ["compost", "Compost"], ["special", "Drop off"], ["check", "Check first"],
  ];
  const fBox = $("guideFilters");
  FILTERS.forEach(([key, label]) => {
    const b = document.createElement("button");
    b.className = "chip" + (key === "all" ? " active" : "");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", () => {
      guideFilter = key;
      fBox.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      b.classList.add("active");
      renderGuide();
    });
    fBox.appendChild(b);
  });
  function renderGuide() {
    const q = ($("guideSearch").value || "").toLowerCase().trim();
    const list = GUIDE.filter(([name, mat]) => {
      const v = MATERIAL_INFO[mat].verdict;
      if (guideFilter !== "all" && v !== guideFilter) return false;
      if (q && !name.toLowerCase().includes(q)) return false;
      return true;
    });
    $("guideList").innerHTML = list.length ? list.map(([name, mat, note]) => {
      const m = MATERIAL_INFO[mat];
      return `<div class="guide-item">
        <span class="gname">${esc(name)}</span> ${verdictChip(mat)}
        <p>${m.bin}. ${note}</p>
      </div>`;
    }).join("") : `<p class="muted">Nothing matches that search. Try a simpler word, like "bottle" or "box".</p>`;
  }
  $("guideSearch").addEventListener("input", renderGuide);
  renderGuide();

  // ---------- impact log ----------
  const KEY = "sortsense-log-v1";
  function readLog() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }
  function writeLog(l) { localStorage.setItem(KEY, JSON.stringify(l)); }
  function renderImpact() {
    const log = readLog();
    let co2 = 0, kg = 0;
    const days = new Set();
    log.forEach((e) => { co2 += e.co2Kg || 0; kg += e.kg || 0; days.add(e.date); });
    $("stItems").textContent = log.length;
    $("stCo2").textContent = co2 < 1 ? (co2 * 1000).toFixed(0) + " g" : co2.toFixed(2) + " kg";
    $("stKg").textContent = kg < 1 ? (kg * 1000).toFixed(0) + " g" : kg.toFixed(2) + " kg";
    $("stDays").textContent = days.size;
    $("logEmpty").style.display = log.length ? "none" : "";
    $("logList").innerHTML = log.slice(-10).reverse().map((e) =>
      `<li><span>${esc(e.name)}</span><span>${e.date}</span></li>`).join("");
  }
  $("logBtn").addEventListener("click", () => {
    if (!currentResult) return;
    const good = currentResult.parts.filter((p) => ["recycle", "compost"].includes(MATERIAL_INFO[p.material].verdict));
    let co2 = 0, kg = 0;
    good.forEach((p) => {
      const m = MATERIAL_INFO[p.material];
      const w = p.weightKg || 0.03;
      kg += w;
      co2 += w * (m.co2PerKg || 0);
    });
    const log = readLog();
    log.push({
      name: currentResult.name,
      date: new Date().toISOString().slice(0, 10),
      co2Kg: Math.round(co2 * 1000) / 1000,
      kg: Math.round(kg * 1000) / 1000,
    });
    writeLog(log);
    renderImpact();
    $("logBtn").textContent = "Logged";
    setTimeout(() => { $("logBtn").textContent = "Log this as recycled"; }, 2000);
  });
  $("clearLog").addEventListener("click", () => {
    if (confirm("Clear your whole log?")) { writeLog([]); renderImpact(); }
  });
  renderImpact();
})();
