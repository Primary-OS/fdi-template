/* ============================================================================
   build-data-template.js — schema for the FDI scroll cinematic (build.html)
   ----------------------------------------------------------------------------
   build.html is 100% generic; this file is the ONLY founder-specific input.
   Copy to the build repo as `build-data.js` and fill every key from the
   build's own REAL artifacts — never invent numbers, quotes, or sources.

   Generation sources per key:
     - config.json          -> founder block, geo, excluded competitors
     - CONTEXT.md           -> narration voice, market stats, wow reasoning
     - webset-spec.json     -> process stages, axes, scan query, enrichments
     - scored companies     -> companies[], evidenceFeed, partners
       (webset-response.json / data.js / phase7-scored equivalents)

   COPY RULES for every narration string (validated in Phase 10):
     - Voice: confident analyst briefing the founder. No vendor pitch.
     - Hyphens only. NEVER em dashes.
     - A SAMPLE, NEVER A CENSUS. What ships is a first-pass sample of the
       strongest ICP fits our process surfaced, shown to the founder to sharpen
       the filtering and the signals. It is not the market and not a finished
       target list. Banned outright: "most ready to buy", "the readiest buyers",
       "the [N] accounts to target", "we scan the entire market", "accounts worth
       walking into", and any market-wide superlative. Scope rankings to
       "relative signal strength within this sample". (Jason, 8/17.)
     - Numbers that came from the FOUNDER get attributed ("your own sizing"), and
       every count reads as an artifact of the process, never as the size of the
       opportunity. [X] profiled and [Y] curated are different numbers - never
       conflate them.
     - Three rendered lines maximum per beat, and no line may wrap onto a single
       orphan word. Measure it: `npm run smoke` in the template repo renders both
       pages and fails on either.
     - Honest hedges stay ("illustrative", "where we have one").
     - Apostrophes inside JS strings must be curly (’), never straight quotes
       that terminate the string.
   ============================================================================ */
window.BUILD_DATA = {
  founder: {
    // The COMPANY name, not the product. Despite the token's name, this slot is
    // the site's IDENTITY: build.html renders it as the "<name> x Primary" masthead,
    // the intro beat, the live-build badge and the page title. A product name here
    // introduces the company as its own product (Forgepoint shipped as "Frank x
    // Primary", 8/17). The product belongs in the narration prose, where it reads
    // as the thing being sold.
    name: "{{PRODUCT_NAME}}",            // from config.json -> company name
    cobrand: "Primary",
    fileNo: "",                          // optional "FDI-###" badge; "" hides it
    hero3d: "",                          // optional named 3D object for the opener ("lantern" available); omit = neon-tube render of logoSvg
    tagline: "{{PRODUCT_TAGLINE}}",       // REPLACE (no token may survive): renders above introHeadline in beat 1; set "" if it would restate the headline (anti-duplication)
    oneLine: "{{PRODUCT_ONELINE}}",       // REPLACE (no token may survive)
    // ---- logo -------------------------------------------------------------
    // SET logoSvg YOURSELF: the same inline <svg> mark as the dashboard's
    // PRODUCT_LOGO_SVG, or "" if there is none. Never leave the token: ANY
    // leftover {{TOKEN}} in this file makes the engine's backfill discard the
    // whole file for a skeleton backstop with no process, axes or partners (C3).
    // When the founder uploaded a logo, fdi-engine scripts/fdi/build-logo-assets.mjs
    // then overwrites logoSvg and adds the keys below; do not write those yourself.
    logoSvg: '{{PRODUCT_LOGO_SVG}}',     // inline SVG (24x24 viewBox); the engine may swap in an <img> at the generated square icon
    // logoMarkWhite: white-on-transparent silhouette for the ghost mark behind
    // the intro. ABSENT when the build could not derive one it trusted - the
    // ghost falls back to logoSvg, which is plain but never a coloured smear.
    // Never hand-derive this by thresholding a colour logo; supply a designed
    // asset or leave it out.
    // logoMarkWhite: '<img src="./assets/logo-mark-white.png" alt="">',
    // logoChipBg: the brand colour sampled from the logo, painted behind the
    // header mark on BOTH pages (the dashboard reads it from this file, C7). A
    // white-on-colour signet is invisible on the default chip.
    // logoChipBg: "#b80000",
    // logoIsFilled: true for a solid signet, false for line art. A filled mark
    // needs a quieter ghost (lower opacity, no glow, smaller) than line art.
    // logoIsFilled: false,
    // themeAccent (optional): per-founder override of the Ember default.
    // AUTO-FILLED by the skill (Phase 8c) from the chosen preset in theme-presets.json
    // when config.theme_color is set; omit to keep Ember. Hand-set to override a preset.
    // Values are raw HSL triples (no hsl() wrapper).
    // themeAccent: { acc: "26 96% 58%", accSoft: "33 100% 68%", accDeep: "20 88% 46%",
    //                acc2: "262 80% 60%", bgh: "240 14% 5%", nh: "240 8%" }
  },

  // ---- per-founder copy for every act (all REQUIRED; generic fallbacks exist
  //      in build.html but shipping fallbacks fails the Phase 10 check) -------
  narration: {
    // LEAVE THESE THREE EMPTY. The intro beat and hero carry locked, approved,
    // company-agnostic copy inside build.html (Jason + Alex, 8/17): the intro
    // sells Primary's PROCESS and must contain no account counts or sample sizes,
    // and the hero's two lines are Alex's exact wording. An empty string here
    // renders the locked default. Only override if the founder's own review asks,
    // and never with a product pitch aimed back at the founder.
    introHeadline: "",                   // locked default; accent spans allowed if you must override
    introWarmth: "",                     // absent = locked default process line; "" = hide the line (Imprest removed it). Budget 28 words.
    heroTitle: ["", ""],                 // locked default; if overridden, each line must hold ONE rendered line (<=46 chars)
    heroSub: "",                         // may contain <b>...</b>; ends "Scroll to watch it run."
    heroStats: [                         // EXACTLY 3 (one row; the gate fails any other count), every label distinct and
                                         // <= 6 words, no null after backfill (gate). Founder-facing first (SKILL Rule 38):
                                         // what the market is to THEM, what sits behind the sample, who to talk to.
                                         // Five long labels wrapped to two rows on Plexa (10/13); Alex cut to three.
      { n: 0, label: "in your ICP (your sizing)" },                  // scan.universe, in the founder's own sizing.
                                         // n may carry up to 2 decimals and renders as written: { n: 2.5, suffix: "M" } -> "2.5M" (C12).
      { n: 10, label: "accounts researched in depth" },
      { n: null, label: "named contacts" }               // optional third slot. WRITE null: backfill-build-data.mjs stamps the
                                                         // derived value after the Affinity fetch, or swaps in a cited-sources
                                                         // count when there are no warm paths. It never ADDS this stat.
      // Other third slots that hold up: { n: 0, suffix: "M", label: "customers behind that market" } (your sizing,
      // suffix renders "22M"); { n: 0, suffix: "+", label: "customers behind these accounts" } (only when cited on the
      // accounts themselves).
    ],
    icp: "",                             // act 02 narration, <=2 sentences
    signals: "",                         // act 03
    evidence: "",                        // act 05 — name the actual enrichment fields
    score: "",                           // act 06 — mention founder weights; score orders, not qualifies
    shortlist: "",                       // act 07 — quality framing
    network: "",                         // act 08 — Primary's network, real relationships
    finaleSub: "",                       // finale — universe -> shortlist -> warm path; restates the scan.universe TAM number in prose
    finaleWarmth: "",                    // optional warmth line between the finale CTA and replay; 1 sentence, <b> on the close (Rule #18); hidden when absent
    scanCollapsedLabel: "high-fit matches we research in depth",
    excludeLabel: "",                    // "Excluded up front: ..." one line
    partnersHeading: ""                  // optional; "" = derived from partners[].status (see partners below)
  },

  // ---- act 02: derive the ICP ----------------------------------------------
  icp: {
    read: [ { label: "", meta: "" } ],   // 4 items: founder materials, calls, Primary research, public sources.
                                         // Never an investor-process word the D1 deploy gate denies (engine sensitive-policy.json;
                                         // Frost shipped two in these labels). Comments count: D1 reads the whole file.
    qualifier: [ "" ],                   // 5 plain checkable criteria
    buyer: "",                           // exact buyer title
    geo: ""
  },

  // ---- act 01: the process (stages + REAL tools; logos in assets/logos) ----
  // Every tool NAME here is a citation. If this build never called it, it must not
  // appear: a tool list carried over from a previous build is a fabricated
  // citation, and one shipped to a founder on 8/17 (Sumble and D&B, neither of
  // which the build touched). The publish gate refuses names it cannot find in
  // data.js / BUILD_NOTES.md. Same rule for enrichments[].src and evidenceFeed.
  process: {
    lead: "",                            // one-line hands-on framing
    foot: "",                            // mono footer line
    stages: [                            // exactly 5: Discover / Design the signals /
      { stage: "", tools: [""], bullets: ["", "", ""] }  // Enrich & verify / Score / Map the way in
    ]
  },

  // ---- act 03: the signals ---------------------------------------------------
  // 4 axes. Weights sum to 100. Exactly ONE axis carries wowNote (the
  // founder-specific WOW signal) — that card gets the big treatment.
  axes: [
    { key: "", name: "", weight: 0, kind: "Founder-specific|Standard",
      short: "",                         // optional 1-word formula label if name's first word reads wrong
      measures: "", five: "",
      wowNote: { eyebrow: "Why X is the sharpest signal", body: "" }  // on ONE axis only; <b> allowed; body <= 50 words (gate; Plexa shipped 106)
    }
  ],

  // ---- act 04: scan the market ----------------------------------------------
  scan: {
    universeLabel: "",                   // plural noun phrase; attribute the founder's own figure, e.g. "in your ICP, your sizing"
    universe: 0, groups: 0, matched: 0, curated: 10, partners: 0,   // universe = NARROW-ICP estimate matching the scan query, NOT broad TAM
    query: "",                           // the Webset search query, human-readable
    funnel: { universe: "in your ICP, your sizing", groups: "scanned in this first pass", matched: "researched in depth" },  // a first-pass deep dive, never "21 of 507K fit"
    // The scan beat's big count is an artifact of the PROCESS, never a sample-size
    // stat. Pattern (Alex's wording for the tool list is mandatory):
    //   "[Universe number, attributed to the founder's own sizing]. We pointed our
    //    process at [the segments] - Exa websets, web scraping, enrichment,
    //    hands-on research - and it surfaced [X] high-quality companies. This is a
    //    sample; the same process scales to the whole universe."
    methodNote: "",                      // optional, <=40 words (gate). Frame as a first pass that shows the process: "About N fit your ICP. For this first pass we scanned a slice, researched X in depth, and picked ten to show what the process can do."
    excludes: [ "" ]                     // competitor/vendor names struck out on screen
  },

  // ---- act 05: pull the evidence --------------------------------------------
  // src is ONE source name, spelled exactly as it appears in data.js or BUILD_NOTES.md
  // (the gate looks for that exact name there). "Exa + LinkedIn" and "Exa search" failed it
  // on Plexa (10/13); write "Exa", or add the name to BUILD_NOTES.md's sources.
  enrichments: [ { field: "", src: "" } ],  // ~8 columns actually enriched

  // terminal feed: 8-9 REAL citations from the scored companies' sources.
  // [tier ("1"|"2"), source name, one-line claim]. Never fabricated.
  evidenceFeed: [ ["1", "", ""] ],

  // ---- acts 06/07: the scored companies (top of list = hero account) --------
  // `score` is the RAW composite. build.html rescales it at runtime to a 70-100
  // display band (top pick 100, floor 70) using the SAME formula the dashboard
  // runs, so the two surfaces cannot drift - which is exactly what happened when
  // scores were hand-written. Never pre-scale a value here; it would be scaled
  // twice. Raw is preserved on `_scoreRaw` after the map runs.
  companies: [
    { name: "", seg: "", tier: "high|med|low", score: 0,
      s: { /* one 0-5 value per axes[].key */ },
      // display fields shown in tooltips / dashboard parity:
      hq: "", ownership: "", wow: "",
      contact: { name: "", title: "" },
      sources: [ { t: "Source — claim", tier: 1 } ], srcCount: 0 }
  ],

  // status is shown as written and LEADS with the state. The heading above the
  // cards follows it: every status signed -> "Already signed & onboarding"; some ->
  // "Signed & in the pipeline"; none -> "Already in the pipeline". Signed means the
  // status OPENS with signed / onboarded / onboarding / live / customer and has no
  // negation or pre-contract word (not, yet, LOI, pilot, trial, prospective,
  // discovery...); "pipeline - LOI not yet signed" is pipeline (C9). Never call a
  // pipeline account signed. [] hides the block.
  partners: [ { name: "", status: "", note: "" } ],  // "signed", "onboarding", "pipeline - LOI in review"

  // ---- act 08: the warm-path network ----------------------------------------
  // Connectors are ROLE-BASED and illustrative unless real Affinity data is
  // supplied. Each account appears under exactly ONE connector (a partition);
  // secondary paths go in alsoReaches (rendered as a ring, not an edge).
  network: {
    // show: false removes act 08 entirely - the scene, its rail entry and its
    // render hook. Default (absent) is ON. Use the flag rather than commenting the
    // markup out, which is how both 8/17 builds did it and left defused HTML
    // behind. Unrelated to the DASHBOARD's Network tab, which is real Affinity
    // data written by the engine after the build.
    // show: false,
    hub: "Primary",
    illustrative: true,
    shortNames: {},                      // display-name overrides where suffix-strip heuristic reads wrong
    connectors: [ { key: "pp", role: "Primary Partner", accounts: [""] } ],
    alsoReaches: { }                     // { "Company Name": ["connectorKey"] }
  }
};
