/* Mock build-data.js for the smoke test — a CONFORMING build.
   Deliberately mirrors what a good build ships: three hero stats, a locked intro
   beat, sample-not-census narration, raw scores (the template rescales them),
   and no banned phrases. The smoke test asserts against this, so when a copy
   rule changes here it must change in build-data-template.js too. */
window.BUILD_DATA = {
  founder: {
    name: "Acme Robotics",
    cobrand: "Primary",
    fileNo: "FDI-000",
    tagline: "Warehouse automation for mid-market 3PLs",
    oneLine: "Acme Robotics automates pick-and-pack for third-party logistics operators.",
    logoSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 18 L12 4 L20 18 Z"/><path d="M8 14 h8"/></svg>'
  },

  narration: {
    // Left empty on purpose: the intro beat and hero are locked template defaults
    // (Jason 8/17), so a conforming build lets build.html supply them. Keeping
    // them blank here is what proves the defaults render and fit.
    introHeadline: "",
    introWarmth: "",
    heroTitle: ["", ""],
    heroSub: "The machine we built around <b>Acme Robotics</b> - custom signals, cited evidence, a readiness score on every account, and a warm path in. Scroll to watch it run.",
    heroStats: [
      { n: 14000, label: "in your ICP, your sizing" },
      { n: 12, label: "accounts researched in depth" },
      { n: 96, label: "cited sources" }
    ],
    icp: "We read your materials, sit with the buyer calls, and study the category - then write the ICP down as plain criteria we can check against any company we surface.",
    signals: "Standard firmographics only get you so far. We invent signals specific to your wedge and weight them by how strongly each one predicts a buyer who is ready now.",
    evidence: "Every field on every account, each claim backed by tiered sources. Nothing ships uncited.",
    score: "The four signals combine on your weights into a single readiness score, shown on a 70-100 display band. It sets the order you work this sample - not whether an account belongs.",
    shortlist: "A first-pass sample of the strongest fits our process surfaced, ranked by relative readiness within this sample.",
    network: "Through Primary's network of partners, advisors, founders, and operators, we already hold warm introductions into part of this sample. Every line is a real relationship.",
    finaleSub: "From an estimated 14,000 companies in your ICP, a first-pass sample of 12 accounts, each with a warm path where we have one.",
    finaleWarmth: "There is <b>so much more we can map and build together</b>.",
    scanCollapsedLabel: "high-quality companies found through web scraping, Exa, LinkedIn, and hands-on research",
    excludeLabel: "Excluded up front"
  },

  icp: {
    read: [
      { label: "Founder deck + company materials", meta: "Series A deck, 2026" },
      { label: "Buyer calls", meta: "3 recorded calls" },
      { label: "Primary research", meta: "Shared workspace" },
      { label: "Our own research", meta: "Category teardown" }
    ],
    qualifier: [
      "Operates 3+ distribution centers",
      "Third-party logistics or in-house fulfillment",
      "50-500 warehouse associates",
      "No incumbent robotics vendor under contract",
      "US or Canada headquarters"
    ],
    buyer: "VP of Operations",
    geo: "US + Canada"
  },

  process: {
    lead: "We pointed our process at mid-market 3PLs and read every company it surfaced.",
    foot: "Exa Websets · LinkedIn · Claude · hands-on research",
    stages: [
      { stage: "Discover", tools: ["Exa Websets"], bullets: ["Structured the ICP as search criteria", "Ran the webset across the segment", "Kept only companies clearing the structural gate"] },
      { stage: "Design the signals", tools: ["Claude"], bullets: ["Translated the wedge into four signals", "Weighted each by predictive strength", "Wrote the 0-5 rubric per signal"] },
      { stage: "Enrich & verify", tools: ["LinkedIn", "Exa"], bullets: ["Pulled firmographics and headcount", "Verified every claim against a source", "Dropped anything we could not cite"] },
      { stage: "Score", tools: ["Claude"], bullets: ["Scored each account on all four axes", "Blended on your weights", "Ranked within this sample"] },
      { stage: "Map the way in", tools: ["Affinity", "LinkedIn"], bullets: ["Checked each account against Primary's graph", "Surfaced warm paths where they exist", "Named the connector on every line"] }
    ]
  },

  axes: [
    { key: "competitive_distress", name: "Throughput Ceiling", weight: 30, kind: "Founder-specific",
      short: "Ceiling", measures: "Signs the current pick rate caps growth", five: "Publicly stated throughput constraint",
      wowNote: { eyebrow: "Why Throughput Ceiling is the sharpest signal", body: "A 3PL that has <b>already named its throughput ceiling</b> has done your qualifying for you." } },
    { key: "data_residency", name: "Automation Readiness", weight: 25, kind: "Founder-specific",
      short: "Readiness", measures: "WMS maturity and integration surface", five: "Modern WMS with open API" },
    { key: "signal_score", name: "Buying Trigger", weight: 30, kind: "Standard",
      short: "Trigger", measures: "Recent events that open a window", five: "New DC announced in last 6 months" },
    { key: "hiring", name: "Hiring Signal", weight: 15, kind: "Standard",
      short: "Hiring", measures: "Open roles that imply manual strain", five: "5+ warehouse ops roles open" }
  ],

  scan: {
    universeLabel: "companies in your ICP, your sizing",
    universe: 14000, groups: 340, matched: 22, curated: 12, partners: 3,
    query: "third-party logistics operators running three or more distribution centers in the US and Canada",
    funnel: { universe: "est. in your ICP, your sizing", groups: "clear the structural gate", matched: "high-quality companies found" },
    methodNote: "An estimated 14,000 companies in your ICP, your own sizing. We pointed our process at mid-market 3PLs - Exa websets, web scraping, enrichment, hands-on research - and it surfaced 22 high-quality companies. This is a sample; the same process scales to the whole universe.",
    excludes: ["Locus Robotics", "6 River Systems", "Fetch Robotics"]
  },

  enrichments: [
    { field: "Distribution centers", src: "Company site" },
    { field: "Headcount", src: "LinkedIn" },
    { field: "WMS vendor", src: "Exa" },
    { field: "Recent funding", src: "Exa" },
    { field: "Open ops roles", src: "Company careers" },
    { field: "Executive contacts", src: "LinkedIn" },
    { field: "Parent ownership", src: "Exa" },
    { field: "Facility footprint", src: "Company site" }
  ],

  evidenceFeed: [
    ["1", "Company site", "Operates 6 distribution centers across the Midwest"],
    ["1", "Company careers", "Four warehouse operations roles open as of this month"],
    ["2", "Exa", "Announced a new fulfillment center in Q1"],
    ["1", "LinkedIn", "Headcount grew 18% year over year"],
    ["2", "Exa", "Runs a modern WMS with a published API"],
    ["1", "Company site", "Publicly named pick-rate as its growth constraint"],
    ["2", "LinkedIn", "VP of Operations hired within the last year"],
    ["1", "Company site", "Serves ecommerce brands with same-day commitments"],
    ["2", "Exa", "Parent company is privately held"]
  ],

  companies: [
    { name: "Northline Logistics", seg: "core", tier: "high", score: 84,
      s: { competitive_distress: 5, data_residency: 4, signal_score: 4, hiring: 4 },
      hq: "Columbus, OH", ownership: "Private", wow: "Named pick rate as its growth cap",
      contact: { name: "Dana Whitfield", title: "VP of Operations" },
      sources: [{ t: "Company site — throughput statement", tier: 1 }], srcCount: 9 },
    { name: "Harborpoint Fulfillment", seg: "core", tier: "high", score: 79,
      s: { competitive_distress: 4, data_residency: 4, signal_score: 4, hiring: 3 },
      hq: "Savannah, GA", ownership: "Private", wow: "New DC announced this quarter",
      contact: { name: "Marcus Bell", title: "Director of Fulfillment" },
      sources: [{ t: "Exa — expansion announcement", tier: 2 }], srcCount: 8 },
    { name: "Cedar Grove 3PL", seg: "core", tier: "high", score: 76,
      s: { competitive_distress: 4, data_residency: 3, signal_score: 4, hiring: 3 },
      hq: "Reno, NV", ownership: "Private", wow: "Modern WMS with open API",
      contact: { name: "Priya Raman", title: "Head of Operations" },
      sources: [{ t: "Company site — tech stack", tier: 1 }], srcCount: 7 },
    { name: "Ironwood Distribution", seg: "expansion", tier: "med", score: 68,
      s: { competitive_distress: 3, data_residency: 3, signal_score: 3, hiring: 3 },
      hq: "Allentown, PA", ownership: "Private", wow: "Three ops roles open",
      contact: { name: "Sam Ortega", title: "VP of Supply Chain" },
      sources: [{ t: "Company careers — open roles", tier: 1 }], srcCount: 6 },
    { name: "Bayfield Supply Co", seg: "expansion", tier: "med", score: 61,
      s: { competitive_distress: 3, data_residency: 2, signal_score: 3, hiring: 2 },
      hq: "Tacoma, WA", ownership: "Private", wow: "Growing ecommerce mix",
      contact: { name: "Erin Cho", title: "Operations Manager" },
      sources: [{ t: "LinkedIn — headcount trend", tier: 2 }], srcCount: 5 }
  ],

  partners: [
    { name: "Northline Logistics", status: "onboarding", note: "Pilot scoped" },
    { name: "Cedar Grove 3PL", status: "pipeline", note: "Intro made" }
  ],

  network: {
    hub: "Primary",
    illustrative: true,
    shortNames: {},
    connectors: [
      { key: "pp", role: "Primary Partner", accounts: ["Northline Logistics", "Cedar Grove 3PL"] },
      { key: "op", role: "Operator Network", accounts: ["Harborpoint Fulfillment"] }
    ],
    alsoReaches: { "Ironwood Distribution": ["pp"] }
  }
};
