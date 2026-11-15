# SortSense — point, scan, sort right

SortSense tells you whether an item is recyclable, which bin it goes in, and what to do with the parts that are not. Built for **Arbiter Hacks V1, Theme Track: Rethinking Waste**.

## The problem

About a quarter of what people put in recycling bins does not belong there. One greasy box or plastic bag can send a whole truckload to landfill instead. The rules are confusing, they change by city, and nobody reads the council PDF. SortSense answers the question in seconds, at the moment you are holding the item.

## What it does

- **Scan a barcode** — type the number or use your camera. SortSense looks the product up in [Open Food Facts](https://world.openfoodfacts.org/) and breaks down every part of the packaging: jar, lid, seal, box, wrapper, each with its own verdict (recycle, trash, compost, drop off) and a plain explanation of what to do with it. If the live lookup fails or the product is unknown, verified built-in data covers common products, so the app never shows a dead screen.
- **Photo check (beta)** — snap a photo and an on-device image model (MobileNet, TensorFlow.js) guesses what the item is made of, with a confidence score. Everything runs in your browser. Nothing is uploaded. It is labelled a best guess, and the guide is one tap away.
- **What goes where** — a searchable guide to 40 everyday items, with the bin and the reason in plain words.
- **My impact** — log what you recycle and watch the running totals: items, estimated CO2 avoided, and weight kept out of landfill. Saved on your device only. No account, no tracking.

## How it works

A static site. No server, no database, no API key, no cost to run. Open `app/index.html` or serve the `app/` folder:

```sh
cd app && python3 -m http.server 8000
```

- Barcode lookup: Open Food Facts API (free, no key), with a verified built-in fallback table.
- Photo check: MobileNet v2 (ImageNet) bundled in `app/vendor/` — TF.js plus the model weights, so it works fully offline after the first load.
- Impact factors: simplified EPA WARM style estimates per material, labelled as estimates in the app.

## Project structure

```
app/
  index.html        the app
  app.js            all logic: lookup, photo check, guide, log
  data.js           built-in products, guide, material rules, impact factors
  styles.css        styling, mobile first
  vendor/           TF.js + MobileNet model files (self hosted, no CDN)
test-app.js         end-to-end smoke test (Playwright, 15 checks)
video/              demo video build
```

## Test it

```sh
node test-app.js   # serves the app, drives every flow in headless Chromium
```

15/15 checks pass (16 Nov 2026): barcode lookup for 5 demo products, mixed packaging warning, unknown barcode handling, guide search, photo classification (real bottle photo: "water bottle", 83%, PET), impact logging, and zero uncaught errors.

## Data sources and honesty notes

- Product and packaging data: Open Food Facts (open database, ODbL). Live lookup first, built-in fallback second; the source is shown on every result.
- Impact numbers are estimates, not a lifecycle assessment, and the app says so.
- Recycling rules vary by city. The guide is general; the app tells users to check local rules when it matters.

## License

MIT
