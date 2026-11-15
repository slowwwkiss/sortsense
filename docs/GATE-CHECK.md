# Arbiter Hacks V1 — Gate Check (16 Nov 2026)

## Gate zero: eligibility (verified on the Devpost pages)

Source: https://arbiter-hacks-v1.devpost.com/ and /rules, read 16 Nov 2026.

- [x] No residency restriction anywhere in the listing or rules. Title: "Open innovation for all". Tickets: $0.
- [x] No X/Twitter post required. Submission needs: public repo + demo video (YouTube/Vimeo) + written description. Theme track adds one paragraph.
- [x] No live presentation. No pitch, no demo day, no "entrant on camera" rule.
- [x] No KYC. Solo entries allowed, team size 1 to 4.
- [x] Free entry. No fee, no paid API, no credits needed.
- [x] Deadline: 21 Dec 2026 00:00 EST (21 Dec 2026 12:00 WIB).
- [x] Prizes (main page): 1st General $2,100; 1st Theme $2,100; 2nd General $1,550; 2nd Theme $1,550; Participation $500. Plus Adaption/Deployxa credits (non-cash, ignore).
- [x] One submission per team, one track only. Track can be switched before the deadline.

## Track choice: Theme (Rethinking Waste)

Why Theme over General:
- The Theme rubric weights impact 35% and feasibility 20%. A working, deployable, genuinely useful waste tool scores directly on those.
- General rewards "technical ambition" with 1,165 participants across both tracks; most entries default to General, so Theme is the thinner, shallower pool.
- The listing's own examples name exactly what SortSense does: "a tool that identifies whether an item is recyclable".
- Theme has its own separate 1st prize ($2,100), so we compete only against other waste projects, not against every app idea.

## Judging rubric (Theme, 100 pts)

- Impact on the waste problem: 35 — barcode lookup + guide attack the contamination problem directly (about 25% of recycling is contaminated).
- Technical execution: 25 — live API integration, camera barcode scanning, on-device ML, localStorage dashboard, self-hosted model.
- Feasibility: 20 — static site, $0 running cost, GitHub Pages deploy, works offline after first load.
- Presentation and demo clarity: 20 — 2-3 min video showing real scans on real products.

## End-to-end test log (16 Nov 2026)

`node test-app.js` — 15/15 checks pass:
- Page loads, hero visible, TF.js + MobileNet load from local vendor files, no console errors on load.
- Nutella barcode (3017620422003): product found, glass jar + plastic lid + aluminium seal, verdict chips shown, source stated.
- Pringles barcode (5053990104825): mixed-packaging warning shown.
- Unknown barcode: graceful "no product found" message.
- Guide search "battery": finds Battery, drop off point. Empty search: "nothing matches" state.
- Photo check with a real bottle photo (Wikimedia Commons, "Plastic bottle.jpg"): "water bottle", 83% confident, PET plastic, recycle verdict.
- Impact log: 1 item logged, CO2 estimate shown (134 g for one aluminium can).
- No uncaught page errors at end.

## Demo video (16 Nov 2026)

`video/sortsense-demo.mp4` — 123 seconds (limit 2-3 min), 2.7 MB, narrated (gTTS).
Screen recordings of the real app + title/outro slides. Verified frame by frame:
- Nutella scan: full result card, glass jar + PP lid + aluminium seal, "Good news" overall box.
- Pringles: mixed packaging warning, tube Trash / lid Recycle / base Recycle.
- Photo check: "water bottle, 83% confident, PET plastic, Recycle it".
- Impact: 1 item, 134 g CO2 avoided, 15 g kept out of landfill.
First build was 112 s with the photo segment showing only "Loading the model..."; fixed by re-recording with payoff timestamps and skipping the load wait, and by lengthening narration to clear 2:00.

## Repo status (16 Nov 2026, 19:50 WIB) — BLOCKER

- Repo `slowwwkiss/sortsense` does NOT exist yet.
- MCP `create_repository` fails: 403 "Resource not accessible by integration". The GitHub App cannot create repos.
- No local git credentials or PAT on this VM (gh CLI not logged in).
- Push is fully prepared: 20 files, 18.7 MB total, paths file at `tools/push-paths.txt`. Once the empty public repo exists, push with:
  `github push-files --owner slowwwkiss --repo sortsense --branch main --message "SortSense — Arbiter Hacks V1 Theme entry" --source-dir ~/workspace/makefun/arbiter-hacks-v1 --paths-file ~/workspace/makefun/arbiter-hacks-v1/tools/push-paths.txt`
- Risk: push-files is described as a "UTF-8 snapshot" tool; the 4 binary model shards (4 MB each) and the 2.7 MB mp4 may fail. If they do, upload the binaries through the GitHub web UI (the same route used for the BCH repos on 15 Nov) and keep the text files on the MCP push.

Headless Chromium in this VM cannot reach external hosts (egress proxy blocks browser traffic; curl works fine). Consequences here only:
- Live Open Food Facts lookup falls back to verified bundled data in this VM. On any normal network the live path works (verified via curl: Nutella, Coca-Cola, Prince, Evian all return packaging data).
- TF.js and the model are self-hosted in app/vendor/ precisely so the app does not depend on a CDN.
- The demo video is recorded in this VM, so it shows the bundled path with the source label "Open Food Facts, verified 16 Nov 2026". The data shown is identical to the live data.

## Facts verified, not assumed

- Open Food Facts API responses captured 16 Nov 2026: Nutella (glass jar, plastic lid, aluminium seal), Coca-Cola can (aluminium), Prince biscuits (carton + HDPE film), Evian 500ml (PET bottle). Barcodes that returned nothing (5053990104825 Pringles, 5000157023481 Heinz in OFF) are covered by built-in data labelled as such.
- Photo check: real photo classified correctly at 83% confidence.
- Impact factors: simplified EPA WARM style estimates, labelled as estimates in the app and README.
