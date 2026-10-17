#!/usr/bin/env node
/* ============================================================================
   smoke-test.mjs — headless render gate for the RAW template.
   ----------------------------------------------------------------------------
   Why this exists: every one of the template's worst regressions was a SILENT
   one. An unsubstituted {{token}} in executable JS position, a duplicate
   top-level const across concatenated scripts, a straight apostrophe closing a
   JS string - each renders a blank page with no visible error, and each shipped
   to a founder because nothing ever loaded the template in a browser.

   This loads both standard pages in headless Chromium against a conforming mock
   and asserts the invariants that data checks cannot prove: the page executed at
   all, the grid rendered, previews expand in their own column and toggle by row,
   the display score band is right, the hero holds one line per line, and no
   banned copy or em dash reached rendered text.

   Usage:  node scripts/smoke-test.mjs [--keep] [--verbose]
   Exit 1 on any failed check. A missing browser is an INFRA SKIP (exit 0 with a
   loud warning), matching the engine's fail-open-on-infra posture - but a
   browser that launches and then finds problems is always a hard failure.
   ============================================================================ */
import http from "node:http";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdtempSync, cpSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const KEEP = process.argv.includes("--keep");
const VERBOSE = process.argv.includes("--verbose");
// Where an fdi-engine checkout may live: FDI_ENGINE_DIR first, then the usual
// siblings. The browser library, the D1 policy and the copy validator all
// resolve from this one list (R-CT6: only the validator honoured the env var).
const ENGINE_DIRS = [process.env.FDI_ENGINE_DIR, "../fdi-engine", "../../CascadeProjects/fdi-engine", "../../fdi-engine"].filter(Boolean);

/* ── copy rules enforced on RENDERED text (Jason, 8/17) ──────────────────────
   These are the phrases the founder review kept striking out. They are checked
   against textContent, so a rule written into a code comment never trips them. */
const BANNED = [
  { rx: /most ready to buy/i, why: "census claim - the sample is not the market" },
  { rx: /readiest buyers/i, why: "market-wide superlative" },
  { rx: /\bthe \d+ (?:accounts |companies )?to target\b/i, why: "reads as a finished target list" },
  { rx: /scan(?:ning|ned)? the entire market/i, why: "we sample, we do not census" },
  { rx: /worth walking into/i, why: "replaced by the curated-sampling header" },
  { rx: /highest-quality accounts in the market/i, why: "market-wide superlative" },
  { rx: /accounts in the market\b/i, why: "market-wide claim - scope it to the sample" },
  { rx: /\bWelcome\b/, why: "'Hello' - welcome implies the deal is already won" },
  { rx: /—/, why: "em dash - hyphens only in rendered copy" },
];

/* The hero is one row of exactly three stats, short labels, none repeated (the
   2d0efc3 regression shipped 'accounts curated' in two of four slots; Plexa,
   10/13, shipped five long labels that wrapped to two rows). */
const HERO_STAT_COUNT = 3;
const HERO_LABEL_MAX_WORDS = 6;

// ── static file server (same shape as the engine's render-checks harness) ────
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".avif": "image/avif", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".otf": "font/otf" };
function serveDir(dir) {
  const server = http.createServer((req, res) => {
    try {
      const rel = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\/+/, "");
      const fp = path.join(dir, rel || "index.html");
      if (!fp.startsWith(path.resolve(dir)) || !existsSync(fp)) { res.writeHead(404); res.end("not found"); return; }
      res.writeHead(200, { "content-type": TYPES[path.extname(fp)] || "application/octet-stream" });
      res.end(readFileSync(fp));
    } catch { res.writeHead(500); res.end("error"); }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) }));
  });
}

// Resolve playwright-core from this repo or a sibling engine checkout. The
// template has no build step of its own, so a sibling resolve keeps `npm i`
// optional for anyone who just wants to edit HTML.
async function importPlaywright() {
  const tries = ["playwright-core"];
  for (const sib of ENGINE_DIRS) {
    const p = path.resolve(ROOT, sib, "node_modules/playwright-core/index.js");
    if (existsSync(p)) tries.push(p);
  }
  let last;
  for (const spec of tries) {
    try {
      const mod = await import(spec);
      // A bare specifier gives named exports; an absolute path to the CJS entry
      // hangs everything off .default instead.
      const chromium = mod.chromium || mod.default?.chromium;
      if (chromium) return { chromium };
      last = new Error(`no chromium export from ${spec}`);
    } catch (e) { last = e; }
  }
  throw new Error(`playwright-core not importable (tried ${tries.length} path(s)): ${last?.message}`);
}

async function launchBrowser(chromium) {
  const attempts = [{ channel: process.env.FDI_CHROME_CHANNEL || "chrome" }, {}];
  let last;
  for (const opts of attempts) {
    try { return await chromium.launch({ headless: true, ...opts }); } catch (e) { last = e; }
  }
  throw new Error(`could not launch chromium: ${last?.message}`);
}

// ── stage a build dir: template files + the conforming mock ──────────────────
function stage() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "fdi-smoke-"));
  for (const f of ["index.html", "build.html", "data.js", "network-data.js", "competitors.html", "competitors-data.js"]) {
    if (existsSync(path.join(ROOT, f))) cpSync(path.join(ROOT, f), path.join(dir, f));
  }
  if (existsSync(path.join(ROOT, "assets"))) cpSync(path.join(ROOT, "assets"), path.join(dir, "assets"), { recursive: true });
  // build.html reads ./build-data.js; the repo only ships the annotated schema.
  cpSync(path.join(HERE, "mock", "build-data.js"), path.join(dir, "build-data.js"));
  // build.html ships verbatim as the build's index.html; the dashboard is served
  // as dashboard.html. Mirror that so in-page links resolve like a real build.
  cpSync(path.join(ROOT, "index.html"), path.join(dir, "dashboard.html"));
  cpSync(path.join(ROOT, "build.html"), path.join(dir, "walkthrough.html"));
  return dir;
}

// ── in-page helpers, injected once per page ─────────────────────────────────
const HELPERS = `
window.__lineBoxes = function(el){
  if(!el) return 0;
  var r = document.createRange(); r.selectNodeContents(el);
  var rects = Array.from(r.getClientRects()).filter(function(x){return x.width>0.5 && x.height>0.5;});
  // Merge rects that share a top within 2px - a line split across inline spans
  // reports one rect per span, which would over-count lines.
  var tops = [];
  rects.forEach(function(x){ if(!tops.some(function(t){return Math.abs(t-x.top)<2;})) tops.push(x.top); });
  return tops.length;
};
window.__visibleText = function(){
  // textContent of the rendered body, minus <script>/<style>, normalised.
  var clone = document.body.cloneNode(true);
  clone.querySelectorAll('script,style,noscript').forEach(function(n){n.remove();});
  return (clone.textContent||'').replace(/\\s+/g,' ');
};
`;

const results = [];
const add = (name, ok, detail) => { results.push({ name, ok, detail }); if (VERBOSE) console.log(`${ok ? "  ok  " : " FAIL "} ${name} — ${detail}`); };

// ── dashboard checks ────────────────────────────────────────────────────────
async function checkDashboard(page, base) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message || String(e)));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/dashboard.html`, { waitUntil: "networkidle" });
  await page.addScriptTag({ content: HELPERS });

  add("dashboard: no uncaught page errors", errors.length === 0,
    errors.length ? `${errors.length}: ${errors.slice(0, 3).join(" | ")}` : "clean");

  // D1 — the grid actually rendered one card per company in the active tab.
  const grid = await page.evaluate(() => {
    const seg = (typeof getCurrentSeg === "function") ? getCurrentSeg() : null;
    return { expected: seg ? seg.companies.length : -1, cards: document.querySelectorAll("#queue-grid .card").length, cells: document.querySelectorAll("#queue-grid .card-cell").length };
  });
  add("dashboard: one card per company in the active tab", grid.expected > 0 && grid.cards === grid.expected,
    `${grid.cards} card(s) rendered, ${grid.expected} in data`);

  // D2/D3 — preview expands IN ITS OWN COLUMN, and the whole visual row opens
  // together (grid rows share a height; one open preview used to stretch its
  // row-mates into tall blank cards).
  const expand = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll("#queue-grid .card-cell"));
    if (cells.length < 2) return { skip: "fewer than 2 cells" };
    const widthBefore = cells[0].getBoundingClientRect().width;
    const gridWidth = document.querySelector("#queue-grid").getBoundingClientRect().width;
    const rowTop = cells[0].offsetTop;
    const rowMates = cells.filter((c) => c.offsetTop === rowTop);
    const firstName = cells[0].querySelector(".card")?.dataset.key;
    if (!firstName || typeof toggleExpand !== "function") return { skip: "no toggleExpand/data-key" };
    toggleExpand(firstName);
    const after = Array.from(document.querySelectorAll("#queue-grid .card-cell"));
    const expandedNow = after.filter((c) => c.classList.contains("is-expanded"));
    const widthAfter = after[0].getBoundingClientRect().width;
    toggleExpand(firstName);
    const collapsed = document.querySelectorAll("#queue-grid .card-cell.is-expanded").length;
    return { widthBefore, widthAfter, gridWidth, rowMates: rowMates.length, expandedCount: expandedNow.length, collapsed };
  });
  if (expand.skip) {
    add("dashboard: preview expands in its own column", false, `could not test — ${expand.skip}`);
    add("dashboard: preview toggles the whole visual row", false, `could not test — ${expand.skip}`);
  } else {
    // "own column" = the expanded cell is not materially wider than it was, and
    // is nowhere near the full grid width.
    const keptColumn = expand.widthAfter <= expand.widthBefore + 2 && expand.widthAfter < expand.gridWidth * 0.9;
    add("dashboard: preview expands in its own column", keptColumn,
      `cell ${Math.round(expand.widthBefore)}px -> ${Math.round(expand.widthAfter)}px (grid ${Math.round(expand.gridWidth)}px)`);
    add("dashboard: preview toggles the whole visual row", expand.expandedCount === expand.rowMates && expand.collapsed === 0,
      `${expand.expandedCount} cell(s) expanded, ${expand.rowMates} in the row; ${expand.collapsed} left open after collapse`);
  }

  // D3b — the row invariant has to survive a reflow. Filtering changes which
  // companies sit beside each other, which used to strand an expanded card next
  // to collapsed row-mates (the stretched-blank-card state, one layer down).
  const afterFilter = await page.evaluate(() => {
    const cells = () => Array.from(document.querySelectorAll("#queue-grid .card-cell"));
    if (typeof toggleExpand !== "function" || !cells().length) return { skip: "no grid" };
    toggleExpand(cells()[0].querySelector(".card")?.dataset.key, 0);
    const search = document.getElementById("search-input");
    if (!search || typeof renderQueue !== "function") return { skip: "no search input" };
    const before = cells().filter((c) => c.classList.contains("is-expanded")).length;
    // Drop one company out of the list, forcing the survivors to re-flow.
    search.value = "a";
    renderQueue();
    const now = cells();
    const mixedRows = (() => {
      const byTop = new Map();
      now.forEach((c) => {
        const k = c.offsetTop;
        if (!byTop.has(k)) byTop.set(k, []);
        byTop.get(k).push(c.classList.contains("is-expanded"));
      });
      return Array.from(byTop.values()).filter((r) => r.some(Boolean) && !r.every(Boolean)).length;
    })();
    search.value = "";
    renderQueue();
    document.querySelectorAll("#queue-grid .card-cell.is-expanded").forEach(() => {});
    // leave the grid collapsed for the checks that follow
    if (typeof state !== "undefined") { state.expanded = {}; renderQueue(); }
    return { before, rowsAfter: now.length, mixedRows };
  });
  if (afterFilter.skip) add("dashboard: rows stay whole across a filter change", false, `could not test — ${afterFilter.skip}`);
  else add("dashboard: rows stay whole across a filter change", afterFilter.mixedRows === 0,
    `${afterFilter.mixedRows} row(s) left half-expanded after filtering (${afterFilter.rowsAfter} cell(s) rendered)`);

  // D4/D5 — display band is 70-100 anchored on this build's own spread, and the
  // high/med split still derives from the RAW score.
  const scores = await page.evaluate(() => {
    const all = [];
    (typeof SEGMENTS !== "undefined" ? SEGMENTS : []).forEach((s) => s.companies.forEach((c) => all.push(c)));
    if (!all.length) return { none: true };
    const disp = all.map((c) => c._signal);
    const raws = all.map((c) => c._signalRaw);
    const haveRaw = raws.every((r) => Number.isFinite(r));
    const distinctRaw = new Set(raws).size;
    return {
      haveRaw, distinctRaw,
      min: Math.min(...disp), max: Math.max(...disp),
      rawSpread: haveRaw ? Math.max(...raws) - Math.min(...raws) : 0,
      outOfBand: disp.filter((d) => d < 70 || d > 100).length,
      tierMismatch: haveRaw ? all.filter((c) => c.tier !== (c._signalRaw >= 75 ? "high" : "med")).length : -1,
      monotonic: all.slice().sort((a, b) => a._signalRaw - b._signalRaw).every((c, i, arr) => i === 0 || c._signal >= arr[i - 1]._signal),
    };
  });
  if (scores.none) {
    add("dashboard: display scores use the 70-100 band", false, "no companies to score");
    add("dashboard: tier still derives from the raw score", false, "no companies to score");
  } else {
    // Top always reads 100 and nothing falls outside the band. The floor is only
    // pinned to 70 when the raw spread is wide enough to stretch (>= MIN_SPREAD);
    // a tight cohort is shifted instead, so its floor sits above 70 on purpose.
    const wideSpread = scores.rawSpread >= 10;
    const bandOk = scores.haveRaw && scores.outOfBand === 0 && scores.max === 100 && (!wideSpread || scores.min === 70);
    add("dashboard: display scores use the 70-100 band", bandOk,
      scores.haveRaw ? `min ${scores.min} / max ${scores.max}, ${scores.outOfBand} outside 70-100, raw spread ${scores.rawSpread}` : "_signalRaw missing — no rescale is running");
    add("dashboard: tier still derives from the raw score", scores.tierMismatch === 0,
      scores.tierMismatch < 0 ? "_signalRaw missing" : `${scores.tierMismatch} tier(s) disagree with raw >= 75`);
    // Only meaningful once a rescale is running; without _signalRaw the sort key
    // is undefined and the verdict would be noise.
    add("dashboard: rescale preserves rank order", !scores.haveRaw || scores.monotonic === true,
      !scores.haveRaw ? "n/a — no rescale running" : (scores.monotonic ? "monotonic" : "rescale reordered the list"));
  }

  // D6 — banned copy in rendered text.
  const text = await page.evaluate(() => window.__visibleText());
  const hits = BANNED.filter((b) => b.rx.test(text));
  add("dashboard: no banned copy in rendered text", hits.length === 0,
    hits.length ? hits.map((h) => `${h.rx} (${h.why})`).join("; ") : "clean");
}

// ── walkthrough checks ──────────────────────────────────────────────────────
// The one-line hero and three-line narration rules are DESKTOP invariants: they
// come from Jason reviewing builds on a laptop, and at phone width a 46-character
// line cannot hold without shrinking type past readability. Narrow viewports still
// assert the things that matter there - the page executes, nothing clips its
// scene, no banned copy - with a looser text budget.
async function checkWalkthrough(page, base, viewport) {
  const strict = viewport.width >= 1000;
  const HERO_MAX = strict ? null : 3;      // null = must equal the authored count
  const NARR_MAX = strict ? 3 : 8;
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message || String(e)));
  await page.setViewportSize(viewport);
  // Reduced motion is the template's own "everything revealed" state (see the
  // prefers-reduced-motion block in build.html: .rv gets opacity:1 and
  // transform:none). Measuring without it reads elements mid-reveal, still
  // translated 22px down their scene, which fakes a 22px overflow.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${base}/walkthrough.html`, { waitUntil: "networkidle" });
  await page.addScriptTag({ content: HELPERS });
  const tag = `${viewport.width}x${viewport.height}`;

  add(`walkthrough ${tag}: no uncaught page errors`, errors.length === 0,
    errors.length ? `${errors.length}: ${errors.slice(0, 3).join(" | ")}` : "clean");

  // W1 — the hero holds exactly one rendered line per authored line. This is the
  // orphan-word guard: a wrapped hero line drops a single word onto its own row.
  const hero = await page.evaluate(() => {
    const el = document.getElementById("heroTitle");
    if (!el) return { missing: true };
    const authored = (el.innerHTML.match(/<br\s*\/?>/gi) || []).length + 1;
    return { authored, rendered: window.__lineBoxes(el), text: (el.textContent || "").slice(0, 90), fontSize: getComputedStyle(el.closest(".punch-h") || el).fontSize };
  });
  const heroOk = !hero.missing && (HERO_MAX === null ? hero.rendered === hero.authored : hero.rendered <= hero.authored + HERO_MAX);
  add(`walkthrough ${tag}: hero ${strict ? "renders one line per authored line" : "stays compact"}`, heroOk,
    hero.missing ? "#heroTitle missing" : `${hero.rendered} rendered / ${hero.authored} authored at ${hero.fontSize}`);

  // W2 — three hero stats, all labels distinct and short.
  const stats = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll("#heroStats .hstat"));
    const labels = cells.map((c) => (c.querySelector(".l")?.textContent || "").trim());
    const tops = [];
    cells.forEach((c) => { const t = c.getBoundingClientRect().top; if (!tops.some((x) => Math.abs(x - t) < 2)) tops.push(t); });
    return { count: labels.length, labels, distinct: new Set(labels).size, rows: tops.length };
  });
  const longLabels = stats.labels.filter((l) => l.split(/\s+/).filter(Boolean).length > HERO_LABEL_MAX_WORDS);
  add(`walkthrough ${tag}: exactly ${HERO_STAT_COUNT} hero stats, distinct labels of <= ${HERO_LABEL_MAX_WORDS} words`,
    stats.count === HERO_STAT_COUNT && stats.distinct === stats.count && longLabels.length === 0,
    `${stats.count} stat(s), ${stats.distinct} distinct label(s): ${stats.labels.join(" | ")}${longLabels.length ? `; too long: ${longLabels.join(" | ")}` : ""}`);
  // W2a — one row. A desktop invariant: .hero-stats wrapped five stats to 3+2.
  if (strict) add(`walkthrough ${tag}: hero stats sit in one row`, stats.rows === 1, `${stats.rows} row(s)`);

  // W3 — narration beats stay within three rendered lines at their real width.
  // The intro beat's headline and process line are measured too: they are the
  // first thing a founder reads and the locked copy is long enough to wrap.
  const narr = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll(".act-narr"));
    ["introHead", "introWarmth"].forEach((id) => { const e = document.getElementById(id); if (e) els.push(e); });
    return els.map((el) => ({
      id: el.id || el.className || "(unnamed)", lines: window.__lineBoxes(el), text: (el.textContent || "").slice(0, 60),
    })).filter((n) => n.lines > 0);
  });
  const overLong = narr.filter((n) => n.lines > NARR_MAX);
  add(`walkthrough ${tag}: narration beats <= ${NARR_MAX} rendered lines`, overLong.length === 0,
    overLong.length ? overLong.map((n) => `${n.id}: ${n.lines} lines ("${n.text}...")`).join("; ") : `${narr.length} beat(s) all within ${NARR_MAX}`);

  // W2b — the walkthrough runs the SAME rescale as the dashboard, so its shortlist
  // must land in the band too. Two surfaces drifting apart is the bug this replaced.
  const wScores = await page.evaluate(() => {
    const D = window.BUILD_DATA;
    const cos = ((D && D.companies) || []).filter((c) => Number.isFinite(c.score));
    if (!cos.length) return { none: true };
    const disp = cos.map((c) => c.score), raws = cos.map((c) => c._scoreRaw);
    return {
      haveRaw: raws.every((r) => Number.isFinite(r)),
      min: Math.min(...disp), max: Math.max(...disp),
      outOfBand: disp.filter((d) => d < 70 || d > 100).length,
      rawSpread: raws.every((r) => Number.isFinite(r)) ? Math.max(...raws) - Math.min(...raws) : 0,
    };
  });
  if (wScores.none) add(`walkthrough ${tag}: shortlist scores use the 70-100 band`, false, "no scored companies in build-data");
  else add(`walkthrough ${tag}: shortlist scores use the 70-100 band`,
    wScores.haveRaw && wScores.outOfBand === 0 && wScores.max === 100 && (wScores.rawSpread < 10 || wScores.min === 70),
    wScores.haveRaw ? `min ${wScores.min} / max ${wScores.max}, raw spread ${wScores.rawSpread}` : "_scoreRaw missing — no rescale is running");

  // W3b — the WOW note is the largest type on a pinned, overflow:hidden scene,
  // so a size bump that reads well on a desktop can clip on a short viewport.
  const wow = await page.evaluate(() => {
    const el = document.getElementById("wowNote");
    if (!el || getComputedStyle(el).display === "none") return { absent: true };
    // .pin is the element that actually clips (height:100vh; overflow:hidden);
    // .pin-inner is unconstrained and centred inside it, so measuring against
    // the inner wrapper would never show a real clip.
    const pin = el.closest(".pin");
    if (!pin) return { noPin: true };
    const e = el.getBoundingClientRect(), p = pin.getBoundingClientRect();
    return { overflowBottom: Math.round(e.bottom - p.bottom), overflowRight: Math.round(e.right - p.right), h: Math.round(e.height) };
  });
  if (wow.absent || wow.noPin) add(`walkthrough ${tag}: WOW note fits its scene`, true, wow.absent ? "no WOW note in this build" : "no pin ancestor to measure");
  else add(`walkthrough ${tag}: WOW note fits its scene`, wow.overflowBottom <= 2 && wow.overflowRight <= 2,
    `${wow.h}px tall, overflows pin by ${Math.max(0, wow.overflowBottom)}px bottom / ${Math.max(0, wow.overflowRight)}px right`);

  // W4 — banned copy / em dashes in rendered text.
  const text = await page.evaluate(() => window.__visibleText());
  const hits = BANNED.filter((b) => b.rx.test(text));
  add(`walkthrough ${tag}: no banned copy in rendered text`, hits.length === 0,
    hits.length ? hits.map((h) => `${h.rx} (${h.why})`).join("; ") : "clean");
}

// ── partners heading ────────────────────────────────────────────────────────
// The heading above the partner cards is derived from partners[].status. A fixed
// "Already signed & onboarding" sat above an in-pipeline account on Plexa (10/13).
// Each case re-serves the conforming mock with its partners swapped out.
const PARTNER_CASES = [
  { name: "all signed", patch: "D.partners=[{name:'A',status:'signed',note:''},{name:'B',status:'onboarding',note:''}];", heading: "Already signed & onboarding" },
  { name: "some signed", patch: "", heading: "Signed & in the pipeline" },
  { name: "none signed", patch: "D.partners=[{name:'Aspen Power',status:'pipeline',note:''},{name:'B',status:'in pipeline',note:''}];", heading: "Already in the pipeline" },
  { name: "override", patch: "D.narration.partnersHeading='Design partners';", heading: "Design partners" },
  { name: "no partners", patch: "D.partners=[];", hidden: true },
  // C9: status is free text, and a bare word match read negated or pre-contract
  // statuses as signed. These are the reviewer's counter-examples; every one of
  // them must read as pipeline.
  { name: "LOI not yet signed", patch: "D.partners=[{name:'A',status:'pipeline - LOI not yet signed',note:''}];", heading: "Already in the pipeline" },
  { name: "prospective customer", patch: "D.partners=[{name:'A',status:'Prospective customer, in discovery',note:''}];", heading: "Already in the pipeline" },
  { name: "unpaid pilot", patch: "D.partners=[{name:'A',status:'Pilot live in Q1 (unpaid trial)',note:''}];", heading: "Already in the pipeline" },
  { name: "LOI + paid pilot", patch: "D.partners=[{name:'A',status:'Design partner (LOI)',note:''},{name:'B',status:'Paid pilot',note:''}];", heading: "Already in the pipeline" },
  { name: "negated signed", patch: "D.partners=[{name:'A',status:'Not yet signed',note:''},{name:'B',status:'Unsigned',note:''},{name:'C',status:'Signed LOI',note:''}];", heading: "Already in the pipeline" },
  { name: "signed + negated", patch: "D.partners=[{name:'A',status:'Signed design partner',note:''},{name:'B',status:'Customer (churned)',note:''}];", heading: "Signed & in the pipeline" },
  { name: "unambiguous signed", patch: "D.partners=[{name:'A',status:'Live customer',note:''},{name:'B',status:'Onboarded',note:''},{name:'C',status:'Paying customer since 2024',note:''}];", heading: "Already signed & onboarding" },
];
async function checkPartners(ctx, base) {
  const mock = readFileSync(path.join(HERE, "mock", "build-data.js"), "utf8");
  for (const c of PARTNER_CASES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message || String(e)));
    await page.route(`${base}/build-data.js`, (route) => route.fulfill({
      contentType: "text/javascript", body: `${mock}\n;(function(D){${c.patch}})(window.BUILD_DATA);\n`,
    }));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${base}/walkthrough.html`, { waitUntil: "networkidle" });
    const got = await page.evaluate(() => {
      const wrap = document.getElementById("partnersWrap");
      return { heading: (document.getElementById("partnersHead")?.textContent || "").trim(), hidden: !wrap || getComputedStyle(wrap).display === "none" };
    });
    const ok = errors.length === 0 && (c.hidden ? got.hidden : !got.hidden && got.heading === c.heading);
    add(`walkthrough partners (${c.name}): ${c.hidden ? "block hidden" : `heading "${c.heading}"`}`, ok,
      errors.length ? `page error: ${errors[0]}` : (got.hidden ? "block hidden" : `heading "${got.heading}"`));
    await page.close();
  }
}

// ── hero stat values ────────────────────────────────────────────────────────
// C12: the count-up parsed data-count with parseInt, so a founder sizing written
// { n: 2.5, suffix: "M" } rendered "2M" while the gate accepted it. Checked on
// both paths: reduced motion (set at once) and the animated count-up.
const HERO_VALUE_PATCH = "D.narration.heroStats=[{n:2.5,suffix:'M',label:'in your ICP, your sizing'},{n:14000,label:'accounts researched in depth'},{n:0.75,suffix:'+',label:'cited sources'}];";
const HERO_VALUE_WANT = ["2.5M", "14,000", "0.75+"];
async function checkHeroValues(ctx, base) {
  const mock = readFileSync(path.join(HERE, "mock", "build-data.js"), "utf8");
  for (const reduced of [true, false]) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message || String(e)));
    await page.route(`${base}/build-data.js`, (route) => route.fulfill({
      contentType: "text/javascript", body: `${mock}\n;(function(D){${HERO_VALUE_PATCH}})(window.BUILD_DATA);\n`,
    }));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
    await page.goto(`${base}/walkthrough.html`, { waitUntil: "networkidle" });
    if (!reduced) {
      // The count-up fires as beat 2 reveals; scroll through the hero and let the
      // 1.4s ease finish.
      for (let y = 0; y <= 3000; y += 250) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(60); }
      await page.waitForTimeout(2200);
    }
    const got = await page.evaluate(() => Array.from(document.querySelectorAll("#heroStats .hstat .n")).map((n) => (n.textContent || "").trim()));
    const ok = errors.length === 0 && JSON.stringify(got) === JSON.stringify(HERO_VALUE_WANT);
    add(`walkthrough hero stats (${reduced ? "reduced motion" : "animated"}): decimals render as written`, ok,
      errors.length ? `page error: ${errors[0]}` : `rendered ${got.join(" | ")}; want ${HERO_VALUE_WANT.join(" | ")}`);
    await page.close();
  }
}

// ── segment tabs ────────────────────────────────────────────────────────────
// C8: the nav hard-coded pipeline / midmarket / enterprise while data.js carries
// the founder's own buyer types (2 for Imprest, 4 for Plexa). A tab with no
// segment threw on click; a fourth segment had no tab. Each case re-serves the
// template's data.js with SEGMENTS reshaped, clicks every segment tab for real,
// and pokes a stale tab id.
const SEGMENT_CASES = [
  { name: "template's 2 segments", patch: "" },
  { name: "4 segments", patch: "var c=function(i,id,label){var s=JSON.parse(JSON.stringify(SEGMENTS[i]));s.id=id;s.label=label;s.companies.forEach(function(co){co.name=co.name+' '+label;});return s;};SEGMENTS.push(c(1,'enterprise','Enterprise'),c(1,'utilities','Utility Co-ops'));" },
  { name: "1 segment", patch: "SEGMENTS.splice(1);" },
];
async function checkSegmentTabs(ctx, base) {
  const dataJs = readFileSync(path.join(ROOT, "data.js"), "utf8");
  for (const c of SEGMENT_CASES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message || String(e)));
    if (c.patch) await page.route(`${base}/data.js`, (route) => route.fulfill({
      contentType: "text/javascript", body: `${dataJs}\n;(function(){${c.patch}})();\n`,
    }));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}/dashboard.html`, { waitUntil: "networkidle" });
    const shape = await page.evaluate(() => ({
      segs: SEGMENTS.map((s) => ({ id: s.id, label: s.label, n: s.companies.length })),
      tabs: Array.from(document.querySelectorAll("#tab-nav .tab-link")).map((b) => ({ id: b.dataset.tab, text: (b.firstChild && b.firstChild.nodeValue || "").trim() })),
    }));
    const segTabs = shape.tabs.filter((t) => !["all", "network", "contacts"].includes(t.id));
    const parity = segTabs.length === shape.segs.length && segTabs.every((t, i) => t.id === shape.segs[i].id && t.text === shape.segs[i].label)
      && shape.tabs[0]?.id === "all";
    add(`dashboard tabs (${c.name}): one tab per segment, in order, after All`, parity,
      `${segTabs.length} segment tab(s) [${segTabs.map((t) => t.text).join(", ")}] for ${shape.segs.length} segment(s)`);

    const bad = [];
    for (const seg of shape.segs) {
      const before = errors.length;
      // A real click (not switchTab) so the button's own wiring is exercised.
      const btn = page.locator(`#tab-nav .tab-link[data-tab="${seg.id}"]`);
      if (!(await btn.count())) { bad.push(`${seg.id}: no tab for this segment`); continue; }
      await btn.first().click({ timeout: 5000 });
      const got = await page.evaluate((id) => ({
        active: document.querySelector("#tab-nav .tab-link.active")?.dataset.tab,
        cards: document.querySelectorAll("#queue-grid .card").length,
        title: document.getElementById("ctx-title")?.textContent || "",
      }), seg.id);
      if (errors.length > before) bad.push(`${seg.id}: ${errors[errors.length - 1]}`);
      else if (got.active !== seg.id || got.cards !== seg.n || !got.title.includes(seg.label)) bad.push(`${seg.id}: active=${got.active} cards=${got.cards}/${seg.n} title="${got.title}"`);
    }
    add(`dashboard tabs (${c.name}): every segment tab opens its own cards`, bad.length === 0,
      bad.length ? bad.join("; ") : `${shape.segs.length} tab(s) clicked clean`);

    // A stale id (an old #link, a removed segment) must land on All, not throw.
    const stale = await page.evaluate(() => {
      const ghost = ["enterprise", "midmarket", "pipeline", "nope"].find((id) => !SEGMENTS.some((s) => s.id === id));
      try { switchTab(ghost); return { ghost, tab: state.tab }; } catch (e) { return { ghost, err: e.message }; }
    });
    add(`dashboard tabs (${c.name}): a tab id with no segment falls back to All`, !stale.err && stale.tab === "all",
      stale.err ? `switchTab('${stale.ghost}') threw: ${stale.err}` : `switchTab('${stale.ghost}') -> ${stale.tab}`);
    await page.close();
  }
}

// ── logo chip colour ────────────────────────────────────────────────────────
// C7: the chip colour used to arrive as a {{LOGO_CHIP_BG}} token the agent
// blanked before the engine could fill it. The dashboard now reads
// founder.logoChipBg from build-data.js, in the shape build-logo-assets.mjs
// writes it; without the key the chip keeps its default.
async function checkLogoChip(ctx, base) {
  const mock = readFileSync(path.join(HERE, "mock", "build-data.js"), "utf8");
  const stamped = mock.replace(/cobrand:\s*"Primary",/, 'cobrand: "Primary",\n    logoChipBg: "#b80000",');
  // R-CT5: an agent that keeps the schema's commented-out example must not get
  // the example colour painted on the chip.
  const commented = mock.replace(/cobrand:\s*"Primary",/, 'cobrand: "Primary",\n    // logoChipBg: "#b80000",\n    /* logoChipBg: "#00b800", */');
  for (const c of [{ name: "stamped", body: stamped, want: "rgb(184, 0, 0)" }, { name: "absent", body: mock, want: null }, { name: "commented-out example", body: commented, want: null }]) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message || String(e)));
    await page.route(`${base}/build-data.js`, (route) => route.fulfill({ contentType: "text/javascript", body: c.body }));
    await page.goto(`${base}/dashboard.html`, { waitUntil: "networkidle" });
    await page.waitForTimeout(150);
    const got = await page.evaluate(() => {
      const chip = document.querySelector(".logo-mark");
      return { inline: chip ? chip.style.backgroundColor : "(no chip)", token: /\{\{LOGO_CHIP_BG\}\}/.test(document.documentElement.outerHTML) };
    });
    const ok = errors.length === 0 && !got.token && (c.want ? got.inline === c.want : got.inline === "");
    add(`dashboard logo chip (${c.name}): ${c.want ? "tinted from build-data.js" : "keeps the default"}`, ok,
      errors.length ? `page error: ${errors[0]}` : `inline background "${got.inline}"${got.token ? "; LOGO_CHIP_BG token still in the page" : ""}`);
    await page.close();
  }
}

// ── D1 sensitive-phrase policy ──────────────────────────────────────────────
// C6: the template's own schema comment ("memo, calls, diligence") and this
// conforming mock ("Your memo", "Diligence notes") modelled copy the engine's D1
// deploy gate blocks, so a faithful agent failed D1 and leaned on the repair
// pass. Same matching as fdi-engine scripts/fdi/check-deploy-content.mjs: a deny
// hit fails unless an allow match covers it. The engine's policy file is used
// when a sibling checkout has one; the copy below is the fallback.
const D1_FALLBACK = {
  deny: ["\\bdiligence\\b", "\\bterm sheet\\b", "\\bdeal[- ]?flow\\b", "\\binvestment memo\\b", "\\bmemo\\b", "\\bfundrais(?:e|ing|ed)\\b", "\\bcap table\\b"],
  allow: ["\\bmemory\\b", "\\bmemo(?:rial|rable|ize|randum of understanding)\\b", "\\b(?:due|in|under|enters?|entered|entering)[- ](?:due[- ])?diligence\\b"],
};
function loadD1Policy() {
  for (const sib of ENGINE_DIRS) {
    const p = path.resolve(ROOT, sib, "scripts/fdi/sensitive-policy.json");
    if (existsSync(p)) { try { return { policy: JSON.parse(readFileSync(p, "utf8")), from: p }; } catch { /* fall through */ } }
  }
  return { policy: D1_FALLBACK, from: "built-in copy" };
}
function d1Violations(text, policy) {
  const out = [];
  const allow = (policy.allow || []).map((a) => new RegExp(a, "gi"));
  for (const src of policy.deny || []) {
    const re = new RegExp(src, "gi");
    let m;
    while ((m = re.exec(text)) !== null) {
      const s0 = m.index, e0 = s0 + m[0].length;
      const covered = allow.some((a) => { a.lastIndex = 0; let am; while ((am = a.exec(text)) !== null) { if (!am[0].length) { a.lastIndex++; continue; } if (am.index <= s0 && am.index + am[0].length >= e0) return true; if (am.index > e0) break; } return false; });
      if (!covered) out.push(`"${m[0]}" (${text.slice(Math.max(0, s0 - 20), e0 + 20).replace(/\s+/g, " ").trim()})`);
      if (!m[0].length) re.lastIndex++;
    }
  }
  return out;
}
// R-CT4: a comment in a file the agent copies (schema templates, data.js) that
// quotes an uppercase double-brace placeholder survives substitution when it is
// not a real token, and every engine token sweep then fails the build. Real
// tokens are allowed only where the skill substitutes them.
function checkCommentPlaceholders() {
  const hits = [];
  for (const f of ["build-data-template.js", "competitors-data-template.js", "data.js", "build.html"]) {
    const fp = path.join(ROOT, f);
    if (!existsSync(fp)) continue;
    readFileSync(fp, "utf8").split("\n").forEach((line, i) => {
      const at = line.search(/\/\/|\/\*|^\s*\*/);
      if (at < 0) return;
      const m = line.slice(at).match(/\{\{[A-Z0-9_]+\}\}/);
      if (m) hits.push(`${f}:${i + 1} ${m[0]}`);
    });
  }
  add("no double-brace placeholder inside a comment of a copied schema file", hits.length === 0, hits.length ? hits.join("; ") : "clean");
}

function checkD1(dir) {
  const { policy, from } = loadD1Policy();
  // Everything the staged build would deploy, plus the two schema files agents
  // copy wholesale (their comments travel into the build's data files).
  const files = ["index.html", "dashboard.html", "walkthrough.html", "data.js", "build-data.js", "network-data.js", "competitors.html", "competitors-data.js"]
    .map((f) => path.join(dir, f))
    .concat([path.join(ROOT, "build-data-template.js"), path.join(ROOT, "competitors-data-template.js")])
    .filter((f) => existsSync(f));
  const hits = [];
  for (const f of files) for (const v of d1Violations(readFileSync(f, "utf8"), policy)) hits.push(`${path.basename(f)}: ${v}`);
  add("template + mock pass the D1 sensitive-phrase policy", hits.length === 0,
    hits.length ? hits.slice(0, 6).join("; ") : `${files.length} file(s) clean (policy: ${from})`);
}

// ── engine copy validator ───────────────────────────────────────────────────
// The mock is the "conforming" build-data.js, so it must pass the engine's own
// copy gate on top of the template's data.js. It cited "Clay", which the sample
// data.js never names, and failed four citation checks. Runs only when an engine
// checkout is found (FDI_ENGINE_DIR, or a sibling fdi-engine).
function checkEngineCopyGate(dir) {
  const cands = ENGINE_DIRS.map((d) => path.resolve(ROOT, d, "scripts/fdi/lib/validate-gtm-data.mjs"));
  const v = cands.find((p) => existsSync(p));
  if (!v) { add("mock passes the engine copy validator", true, "skipped - no engine checkout (set FDI_ENGINE_DIR)"); return; }
  const r = spawnSync(process.execPath, [v, dir], { encoding: "utf8" });
  const errs = `${r.stdout}\n${r.stderr}`.split("\n").filter((l) => l.startsWith("::error"));
  add("mock passes the engine copy validator", r.status === 0 && errs.length === 0,
    errs.length ? errs.slice(0, 4).join(" | ") : `clean (${path.relative(ROOT, v)})`);
}

// ── main ────────────────────────────────────────────────────────────────────
let dir, server, browser;
try {
  // A missing browser is an infra skip by default so a plain checkout can still
  // run `npm run smoke`. Set FDI_SMOKE_REQUIRE_BROWSER=1 in CI, where "no browser"
  // must never be indistinguishable from "all checks passed".
  const REQUIRE = process.env.FDI_SMOKE_REQUIRE_BROWSER === "1";
  const infraExit = (msg) => {
    if (REQUIRE) { console.error(`\n❌ SMOKE TEST could not run and FDI_SMOKE_REQUIRE_BROWSER=1: ${msg}\n`); process.exit(1); }
    console.warn(`\n⚠️  SMOKE TEST SKIPPED (infra): ${msg}`);
    console.warn("   Install with: npm i -D playwright-core && npx playwright install chromium\n");
    process.exit(0);
  };
  let chromium;
  try { ({ chromium } = await importPlaywright()); } catch (e) { infraExit(e.message); }
  try { browser = await launchBrowser(chromium); } catch (e) { infraExit(e.message); }

  dir = stage();
  server = await serveDir(dir);
  if (VERBOSE) console.log(`staged ${dir}\nserving ${server.url}\n`);

  // The copy sweeps run in node against the page's rendered text, so BANNED
  // stays here and never has to be serialised into the page.
  const ctx = await browser.newContext();

  const p1 = await ctx.newPage();
  await checkDashboard(p1, server.url);
  await p1.close();

  // Two viewports: 900px tall trips the short-viewport media query that carries
  // its OWN font cap (a hero fix applied only to the base rule silently reverts
  // on most laptops); 1000px exercises the base rule.
  // 900px tall trips the short-viewport media query that carries its own font cap;
  // 1000px exercises the base rule; 390x844 is a phone, where the longer locked
  // hero line is the first thing to wrap.
  for (const vp of [{ width: 1440, height: 900 }, { width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const p = await ctx.newPage();
    await checkWalkthrough(p, server.url, vp);
    await p.close();
  }
  await checkPartners(ctx, server.url);
  await checkHeroValues(ctx, server.url);
  await checkSegmentTabs(ctx, server.url);
  await checkLogoChip(ctx, server.url);
  await ctx.close();
  checkD1(dir);
  checkCommentPlaceholders();
  checkEngineCopyGate(dir);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  if (dir && !KEEP) rmSync(dir, { recursive: true, force: true });
  else if (dir) console.log(`\nstaged build kept at ${dir}`);
}

const failed = results.filter((r) => !r.ok);
console.log("\n── template smoke test ──");
for (const r of results) console.log(`${r.ok ? "  ok  " : " FAIL "} ${r.name}\n         ${r.detail}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) { console.error(`\n${failed.length} check(s) FAILED`); process.exit(1); }
console.log("template renders clean\n");
