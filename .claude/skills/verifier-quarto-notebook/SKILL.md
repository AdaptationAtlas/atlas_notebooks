---
name: verifier-quarto-notebook
description: Verify a change to a Quarto / OJS notebook in this repo by driving a real browser against the rendered _site/ HTML, capturing network + console + screenshots across user-visible phases (initial load, scrolls, selection changes), and reporting an evidence-backed verdict. Use this whenever the verify skill is asked to confirm behaviour for a change to notebooks/**/*.qmd — especially when the change concerns when/whether S3 fetches fire, OJS cell evaluation order, IntersectionObserver gates, FileAttachment loading, DuckDB-WASM query timing, or any other runtime behaviour the unit-tests-don't-cover side of the notebook.
metadata:
  type: verifier
---

# verifier-quarto-notebook — evidence-capture protocol

You are verifying a change in this repo's `notebooks/**/*.qmd` source. The change runs in a real browser as compiled OJS + DuckDB-WASM. The only way to know whether it works is to **drive a browser at the rendered HTML and watch what it does.** Tests don't cover this. Type checks don't cover this. Quarto's render-time output doesn't cover this.

## Surface

The surface is the page in a browser, with DevTools-equivalent observability. The user types nothing — they scroll, they pick from selects, they wait. Your job is to drive the same.

## Setup

Run these in order. Each step has a quick **skip** test so a re-run reuses prior work.

### 1. Confirm the rendered HTML is fresh

Compare mtime of `_site/notebooks/<section>/notebook.html` against the qmd source. If the HTML is older than the qmd, re-render is required. **Quarto render of the climateRationale notebook is slow (5+ minutes) — only do it if you must.** If the HTML is newer than the qmd, skip rendering.

```bash
qmd_mtime=$(stat -f "%m" notebooks/climateRationale/notebook.qmd)
html_mtime=$(stat -f "%m" _site/notebooks/climateRationale/notebook.html 2>/dev/null || echo 0)
if [ "$html_mtime" -lt "$qmd_mtime" ]; then
  echo "RENDER NEEDED: HTML is older than qmd source"
  # Ask the user before running quarto render — it's slow.
else
  echo "HTML is fresh — skipping render"
fi
```

### 2. Install playwright + chromium (one-time, ~150MB)

```bash
mkdir -p /tmp/pw-verify && cd /tmp/pw-verify
if [ ! -d node_modules/playwright ]; then
  npm init -y > /dev/null && npm install --no-save playwright
fi
# Check if chromium-headless-shell is cached.
if ! ls ~/Library/Caches/ms-playwright/chromium_headless_shell-* 2>/dev/null | head -1 > /dev/null; then
  npx playwright install chromium
fi
```

Subsequent runs reuse the install — only the first run pays the download cost.

### 3. Start a local HTTP server in `_site/`

```bash
# Pick an unused port. 8765 is fine if nothing else holds it.
cd _site && python3 -m http.server 8765 > /tmp/pw-verify/server.log 2>&1 &
SERVER_PID=$!
sleep 1
# Sanity check
curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://localhost:8765/notebooks/<section>/notebook.html"
```

Save `$SERVER_PID` for cleanup.

**Why `_site/` not the live deploy:** the live deploy may not have the change yet, and even if it does, the live deploy has CORS / CDN / cold-start variability that makes the test noisy. Local serving gives you a clean A/B-able environment with the freshest commit.

## Drive

Write a Playwright script at `/tmp/pw-verify/verify.mjs`. The shape is:

1. Launch headless chromium with a normal viewport (1400 × 900 is safe).
2. **Set up request + console listeners BEFORE navigation.** Misses on init are the most diagnostic findings; you can't recover them after.
3. `page.goto(URL, { waitUntil: 'load' })`.
4. `await page.waitForTimeout(15000)` to let DuckDB-WASM init + the top sections paint.
5. Capture the initial-load network log + screenshot.
6. For each user action you're verifying (scroll to anchor, change select, click button) — drive it via `page.evaluate(...)` or `page.locator(...).click()`, wait ~10–15 s for any S3 fetches to resolve, capture the delta in the request log, screenshot.
7. Close the browser; analyse the captured arrays.

A working template script is at [verify_template.mjs](verify_template.mjs) — copy it to `/tmp/pw-verify/verify.mjs` and adapt the `GATED`, `EXPECTED_INITIAL`, and phase blocks for your specific change.

### Critical gotchas (learned the hard way)

- **OJS console errors are noisy by default.** A page that renders correctly can produce 50–100 "Error evaluating OJS cell" messages during bootstrap as cells fire before their dependencies resolve, then succeed on re-eval. **Don't treat console error count as a fail signal.** Instead, check the screenshot — if the page rendered, the errors were transient.

- **Production isn't always a clean baseline.** The `adaptationatlas.github.io/atlas_notebooks/...` URL may 404 for notebooks that haven't shipped yet. Always confirm with curl before treating prod as ground truth.

- **DuckDB-WASM does multi-stage HTTP range requests per parquet.** A single "fetch" of a parquet generates 5–20 individual HTTP requests (HEAD, footer, column-chunks, row-groups). Count unique parquet paths, not raw request count, when assessing how many parquets were touched.

- **`hive_partitioning=1` in `parquet_scan` forces a footer fetch per file at view-creation time.** This is upstream of the consumer query — gating the consumer doesn't gate the footer fetch. If the change is supposed to defer "all S3 work" for a section, check whether view-registration cells (`db`, `dbFutureHive`, etc.) sit upstream of the gate and run unconditionally.

- **`FileAttachment("/data/...")` path resolution differs slightly between Quarto's dev server and a static `python3 -m http.server`.** If you see a flood of FileAttachment errors, it may be the test environment, not a real bug. Confirm with `curl http://localhost:8765/data/<path>` that the file is reachable.

## Probe

After confirming the headline claim, push on it:

- **Anchor missing / element absent** — the gate's fail-open path should still fire the query. Inject a script before navigation that removes the anchor, re-run.
- **Rapid scroll past the section** — does the gate flip and stay flipped, or can it race the IntersectionObserver disconnect?
- **Selection change mid-load** — pick a country, change it mid-fetch, watch for orphaned queries.
- **Refresh** — does the gate state reset cleanly, or does some cache survive between sessions?
- **Production-side parquet path patches** (`patchWindowsCache`) — confirm they apply locally too.

## Capture

Mandatory artifacts saved to `/tmp/pw-verify/`:

- `report.json` — structured summary (request counts per phase, anchors-in-DOM, scrollY at each phase, console error count)
- `s3_urls.txt` — every S3 request URL, one per line, in order
- `01_initial_load.png`, `02_after_<action>.png`, … — one screenshot per phase
- `verify.mjs` — the script itself, kept so the run is replayable

Do not delete these between phases — the diff between phases is the evidence.

## Report

Lead with the verdict, then the table:

```
## Verification: <one-line what changed>

**Verdict:** PASS | FAIL | BLOCKED | SKIP

**Claim:** <your read of the diff, plus any mismatch with the commit message>

**Method:** verifier-quarto-notebook against _site/<path>.html, served local on :8765, chromium-headless, viewport 1400×900.

### Network behaviour per phase

| Phase | Gated parquet A | Gated parquet B | … |
|---|---|---|---|
| Initial load (15s, no scroll) | <N fetches> | <N fetches> | … |
| After scroll to <anchor> | <delta> | <delta> | … |
| After selection change | … | … | … |

### Steps
1. ✅/❌/⚠️/🔍 <observed behaviour> → <evidence path>
...

**Screenshots:** /tmp/pw-verify/01_initial_load.png et al.

### Findings
- ⚠️ <issue> — <evidence>
- 🔍 <probe outcome> — <observation>
- ✅ <confirmed expectation> — <evidence>
```

## Cleanup

```bash
kill $SERVER_PID 2>/dev/null
```

Keep `/tmp/pw-verify/` between sessions — re-runs save time if the artifacts are still there. Only nuke it if the user asks or if you need a fresh baseline.

## When NOT to use this skill

- **Quarto YAML / `_quarto.yml` config changes** — render to confirm site builds; no need to drive the browser.
- **Static `data/**/*.json` updates** — check the file parses and is referenced correctly; runtime verification is unnecessary.
- **Style-only `styles.css` changes** — screenshot diff against a known-good page; no need for the full network capture protocol.
- **Pure JS helper changes** that don't touch a notebook — use `node --check` or the `claude-api` skill if relevant.

For anything that changes how a notebook **behaves in a browser** — query timing, gate logic, selector interactions, DuckDB query construction, OJS cell dependency graphs — use this skill.
