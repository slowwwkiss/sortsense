# Devpost submission draft — Arbiter Hacks V1 (Theme Track: Rethinking Waste)

## Title
SortSense

## Tagline
Point, scan, sort right. Find out in seconds whether something is recyclable, which bin it goes in, and what to do with the parts that are not.

## Which track
Theme Track: Rethinking Waste

## Description — what it does
About a quarter of what people put in recycling bins does not belong there. One greasy box or plastic bag can send a whole truckload to landfill. The rules are confusing, they change by city, and nobody reads the council PDF. SortSense answers the question in seconds, at the moment you are holding the item.

Scan a barcode and SortSense looks the product up in Open Food Facts, the open product database, then breaks down every part of the packaging: jar, lid, seal, box, wrapper, each with its own verdict and a plain explanation of what to do with it. No barcode? Take a photo and an on-device image model guesses what the item is made of, with a confidence score. Nothing is uploaded. A searchable guide covers 40 everyday items, and a log tracks your impact: items recycled, estimated CO2 avoided, and weight kept out of landfill.

## How we built it
A static site. No server, no database, no API key, no cost to run. Vanilla JavaScript, no framework. The barcode lookup uses the Open Food Facts API with a verified built-in fallback table, so the app never shows a dead screen. The photo check runs MobileNet v2 (TensorFlow.js) entirely in the browser, with the model files self-hosted in the repo, so it works fully offline after the first load. Impact numbers use simplified EPA WARM style factors and are labelled as estimates. Tested end to end in headless Chromium: 15 automated checks pass, covering every flow.

## What is next
Add more local rule sets so the verdicts match the user's city instead of general guidance. Add a shareable monthly impact summary. Grow the built-in product table with community contributions through Open Food Facts.

## Theme paragraph (required for the Theme Track)
The waste problem we targeted is recycling contamination: about 25% of what goes into recycling bins does not belong there, and a single wrong item can send a whole truckload to landfill. SortSense attacks the exact moment the mistake happens, when a person is standing at the bin holding the item. We would measure whether it works by tracking how many items people check and log, and by the share of lookups that end in a correct split of mixed packaging, which is the most common error. The tool is free, needs no account, and runs as a static site, so a city or school could deploy it in an afternoon.

## Built with
JavaScript, TensorFlow.js, MobileNet, Open Food Facts API, GitHub Pages

## Links (fill after publish)
- Public repo: https://github.com/slowwwkiss/sortsense
- Live demo: https://slowwwkiss.github.io/sortsense/ (enable GitHub Pages first)
- Demo video (YouTube): TODO — upload video/sortsense-demo.mp4, paste link here

## Submission checklist (Devpost form)
- [x] Public repo (link above)
- [ ] Demo video 2-3 min on YouTube or Vimeo (file ready: video/sortsense-demo.mp4, 123 s)
- [x] Written description (above)
- [x] Theme paragraph (above)
- [ ] Register on Devpost + pick Theme track + submit before 21 Dec 2026 00:00 EST
