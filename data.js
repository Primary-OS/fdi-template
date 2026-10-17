// ══════════════════════════════════════════════════════════════════════════
// FDI Intelligence Map — data.js TEMPLATE
// ══════════════════════════════════════════════════════════════════════════
// This is the data layer for the FDI dashboard. It exports 7 collections
// that index.html consumes. Replace placeholder data with real research
// for your founder, but keep the structure intact.
//
// READ FIRST: AI_INSTRUCTIONS.md and TEMPLATE_GUIDE.md
// REFERENCE EXAMPLE: github.com/alexg207/valar-fdi (private — request access)
//
// COLLECTIONS:
//   ROW_SOURCES       Citations for individual data rows ("Co|Section|Label" → source)
//   SEGMENTS          Main companies array, organized into tabs
//   CONTACT_MAP       Per-company contact list with warm-intro mapping
//   COMPANY_SOURCES   Hyperlinked references per company (footer of detail view)
//   JOB_LISTINGS      Active job postings per company (drives Hiring sub-score)
//   RESIDENCY_MAP     Vertical-specific axis-2 scoring (rename per project)
//   PRIMARY_TEAM      List of Primary team members for warm-intro attribution
//
// PLACEHOLDER STRATEGY:
//   - 5 fake companies organized into 2 segments (Pipeline, Mid-Market)
//   - Add a third segment (Enterprise) following the same shape when needed
//   - Names like "Acme Corp" deliberately signal "this is a placeholder, replace me"
// ══════════════════════════════════════════════════════════════════════════


/* ────────────────────────────────────────────────────────────────────────
   ROW_SOURCES — citation strings for individual data rows
   ────────────────────────────────────────────────────────────────────────
   Schema:    "<Company>|<Section title>|<Row label>": "<citation string>"
   Used by:   index.html — appears as a tooltip on hoverable cells
   Required:  No, but every claim in SEGMENTS[].sections[].rows benefits from one
   ──────────────────────────────────────────────────────────────────────── */
const ROW_SOURCES = {
  // Example pattern — replicate per company × per section × per row
  "Acme Corp|Company Profile|Industry": "Acme 2025 10-K, SEC EDGAR",
  "Acme Corp|Company Profile|Revenue": "Acme FY2025 Annual Report",
  "Acme Corp|Workflow Opportunity|Use Cases": "Acme engineering blog, 'Scaling X', 2025",
  // ...
};


/* ────────────────────────────────────────────────────────────────────────
   SEGMENTS — the spine of the dashboard
   ────────────────────────────────────────────────────────────────────────
   This is an array of segment objects, each rendered as a top-level tab.
   Common segments: "Active Pipeline" (signed/in-flight) → "Mid-Market"
   (near-term ICP) → "Enterprise" (stretch ICP). See TEMPLATE_GUIDE.md.

   Segment object:
     id            string — slug used in URL/tab state (one tab per segment is
                            built at runtime; never hand-write tab buttons)
     label         string — short display label shown on the segment's tab
     icon          string — emoji or unicode glyph (legacy, can be empty)
     icon_svg      string — inline SVG used in section header (optional)
     eyebrow       string — small uppercase label above title
     title         string — H1 heading for the segment landing
     desc          string — 1–2 sentence description shown under title
     companies     array  — Company objects (see schema below)

   Company object:
     name                       string  — REQUIRED. Display name.
     domain                     string  — REQUIRED. Used for favicon (no protocol).
     subtitle                   string  — One-line description shown under name.
     tier                       string  — 'high' | 'med' | 'low'. Drives sort + filter.
     tags                       array   — UI tags. Each: { t, c, tip? }
                                          c = 'neutral' | 'stack' | 'brand'
                                          ('brand' tag uses founder's accent color — reserve for relationship tags
                                          like "Design Partner", "In Pipeline", "Prospect")
     overview                   string  — Paragraph shown in detail view header.
     sections                   array   — { title, rows: [[label, value], ...] }
                                          The 3-section default: Company Profile,
                                          {Workflow|Domain} Opportunity, GTM Strategy.
                                          Vary section names by vertical.
     contacts                   array   — Inline contacts (also see CONTACT_MAP merge).
     signal_score               number  — 0–5. Axis 3: Buying Trigger.
     signals                    array   — Bullet strings supporting signal_score.
     signal_types               array   — 'positive' | 'negative' per signals[i].
     opp_reason                 string  — Tooltip on Buying Trigger axis.
     competitive_distress       number  — 0–5. Axis 1: rename per vertical.
                                          (Valar default label: "Inference Pain")
     distress_reason            string  — Tooltip on axis 1.
     distress_signals           array   — Supporting bullets for axis 1.
     distress_signal_types      array   — 'positive' | 'negative' per item.
     data_residency             number  — 0–5. Axis 2: rename per vertical.
                                          (Valar default label: "Data Residency")
     residency_reason           string  — Tooltip on axis 2.
     residency_signals          array   — Supporting bullets for axis 2.
     residency_signal_types     array   — 'positive' | 'negative' per item.
     gtm_thesis                 string  — One-paragraph buy-side narrative.
                                          Embedded HTML allowed (e.g., <strong>).
     composite                  number  — OPTIONAL 0–100 override of the computed
                                          /100 signal. Use ONLY to break ties when
                                          whole-point axes collide (e.g. five accounts
                                          all at 85); rank tied accounts by cited
                                          evidence strength. computeSignal() returns it
                                          when present (clamped 0–100); keep the matching
                                          build-data.js companies[].score equal.
   ──────────────────────────────────────────────────────────────────────── */
const SEGMENTS = [

  /* ====================================================================
     SEGMENT 0 — Active Pipeline
     Signed design partners + active conversations. Use this when the
     founder already has named accounts moving. Skip if pre-pipeline.
     ==================================================================== */
  {
    id: 'pipeline',
    label: 'Active Pipeline',
    icon: '🎯',
    eyebrow: 'DESIGN PARTNERS + NAMED PIPELINE',
    title: 'Active Accounts',
    desc: 'Companies already signed as design partners or in active pipeline conversations. Use this view to track current motion and reference-account positioning.',
    icon_svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    companies: [

      // ── 1. CANONICAL placeholder — design partner. Demonstrates the locked
      //    Profile (5 rows) / Section 2 (4 rows) / GTM Strategy (5 rows) shape.
      //    Per SKILL.md Output Style Rule #10, Profile rows are EXACTLY 5:
      //    Industry, Revenue, Employees, then the two facts that matter most to
      //    THIS founder's buyers (the PROFILE_ROW_4 / _5 tokens), chosen in
      //    Phase 5 and labelled the same on every account. Software example:
      //    Cloud Provider, AI Maturity. Energy example: Asset Type,
      //    Energy-Program Maturity. (Plexa, 10/13, shipped the software pair on
      //    energy accounts.) ROW_SOURCES keys use the same labels.
      //    DO NOT add Founded, Headquarters, "[Founder] Status", Stage, or
      //    other rows — relationship status lives in tags as a brand chip.
      {
        name: 'Acme Corp',
        domain: 'acme.example',
        subtitle: '[REPLACE: ≤18 words. Pattern: what the company is, why-they-fit-Valar phrase, relationship status]',
        tier: 'high',
        tags: [
          { t: 'Design Partner', c: 'brand', tip: 'Signed design partner' },
          { t: '[Industry sector]', c: 'neutral' },
          { t: '[Specific constraint, e.g., HIPAA / PCI / GDPR / FedRAMP]', c: 'stack', tip: 'Reason the default vendor doesn\'t work for this company' }
        ],
        overview: '[REPLACE: 3–5 sentences naming the company\'s position in the founder\'s market story, the specific data sensitivity in concrete terms, and the category-level reference. Splice founder voice from CONTEXT.md if natural.]',
        sections: [
          {
            title: 'Company Profile',
            rows: [
              ['Industry', '[Specific industry — SIC/NAICS preferred]'],
              ['Revenue', '[$X.XB (FY2025) — range if estimated]'],
              ['Employees', '[Headcount]'],
              ['{{PROFILE_ROW_4}}', '[Buyer-specific fact, e.g. AWS / GCP / Azure (software) or C&I rooftop / storage (energy)]'],
              ['{{PROFILE_ROW_5}}', '[High / Med / Low — one sentence of supporting evidence]']
            ]
          },
          {
            title: '{{SECTION_2_LABEL}}',  // e.g., "Inference Footprint" / "Workflow Footprint" / "Capex Footprint" / "Compliance Footprint" — chosen in Phase 5
            rows: [
              ['Use Cases', '[Specific use cases this company runs that map to the founder\'s product]'],
              ['Current Stack', '[Named platforms / vendors / tools they use today]'],
              ['Pain Points', '[CFO language first: margin/cost/COGS/opex impact. Constraint enumeration second.]'],
              ['Estimated Spend', '[$X–$Y range. Method: derived from revenue × AI-headcount-share × industry default. NEVER "needs verification".]']
            ]
          },
          {
            title: 'GTM Strategy',
            rows: [
              ['Approach', '[Already-executed: focus is reference development. Or: planned land/expand sequence.]'],
              ['Key Evidence', '[Cited public signals supporting the thesis]'],
              ['Urgency Level', 'EXECUTE'],
              ['Target Buyer', 'Buyer: [persona / role type]. Champion: [persona / role type].'],
              ['Messaging Angle', '[1–2 sentence positioning. Include a quoted opening line.]']
            ]
          }
        ],
        contacts: [],
        signal_score: 5,
        signals: ['Already signed as design partner', '[Second supporting signal with cited source]', '[Third supporting signal with cited source]'],
        signal_types: ['positive', 'positive', 'positive'],
        opp_reason: 'Signed design partner — priority is reference-account development for the rest of the vertical.',
        competitive_distress: 4,
        distress_reason: '[Founder-specific axis-1 reason: vertical-specific pain framing]',
        distress_signals: ['[Supporting bullet 1, with citation]', '[Supporting bullet 2, with citation]'],
        distress_signal_types: ['negative', 'negative'],
        data_residency: 5,
        residency_reason: '[Founder-specific axis-2 reason. For score 5: must include cited evidence in the wow shape per Phase 5 WOW_EVIDENCE_SHAPE.]',
        residency_signals: ['[Supporting bullet 1, with citation]', '[Supporting bullet 2 — cited wow-shape evidence]'],
        residency_signal_types: ['negative', 'negative'],
        gtm_thesis: '[REPLACE: 3-sentence pattern. Anchor sentence (why NOW). Motion sentence (the wedge). Buyer call-out at end. Splice verbatim founder quotes from CONTEXT.md if they fit.] <strong>Buyer:</strong> [persona / role type]. <strong>Champion:</strong> [persona / role type]. <strong>NOT</strong> [antagonist persona per CONTEXT.md].'
      },

      // ── 2. Placeholder pipeline account. Demonstrates same locked 5/4/5 shape
      //    at tier='med' with thinner research. Replace with real named-pipeline
      //    account from CONTEXT.md.
      {
        name: 'Beta Industries',
        domain: 'beta.example',
        subtitle: '[REPLACE: ≤18 words. Pattern: what the company is, why-they-fit-Valar phrase, "named pipeline" or relationship]',
        tier: 'med',
        tags: [
          { t: 'In Pipeline', c: 'brand', tip: 'Active pipeline conversation' },
          { t: '[Industry sector]', c: 'neutral' }
        ],
        overview: '[REPLACE: 3–5 sentences. Same pattern as Acme above.]',
        sections: [
          {
            title: 'Company Profile',
            rows: [
              ['Industry', '[X]'],
              ['Revenue', '[$X.XB (FY2025)]'],
              ['Employees', '[X]'],
              ['{{PROFILE_ROW_4}}', '[X]'],
              ['{{PROFILE_ROW_5}}', '[X]']
            ]
          },
          {
            title: '{{SECTION_2_LABEL}}',
            rows: [
              ['Use Cases', '[X]'],
              ['Current Stack', '[X]'],
              ['Pain Points', '[X — CFO language first]'],
              ['Estimated Spend', '[$X–$Y range with method]']
            ]
          },
          {
            title: 'GTM Strategy',
            rows: [
              ['Approach', '[X]'],
              ['Key Evidence', '[X]'],
              ['Urgency Level', 'HIGH'],
              ['Target Buyer', 'Buyer: [persona]. Champion: [persona].'],
              ['Messaging Angle', '[X]']
            ]
          }
        ],
        contacts: [],
        signal_score: 4,
        signals: ['[Signal 1 with citation]', '[Signal 2 with citation]'],
        signal_types: ['positive', 'positive'],
        opp_reason: '[Why this is a real opportunity]',
        competitive_distress: 3,
        distress_reason: '[Axis 1 explanation]',
        data_residency: 4,
        residency_reason: '[Axis 2 explanation. Score 5 requires wow-shape evidence; cap at 4 without it.]',
        gtm_thesis: '[REPLACE: 3-sentence pattern with Buyer/Champion/NOT-antagonist call-out.] <strong>Buyer:</strong> [persona].'
      }

    ]
  },

  /* ====================================================================
     SEGMENT 1 — Mid-Market (Stage 1 ICP, near-term)
     Companies that match the founder's primary near-term ICP. These are
     accounts that should convert in 6–12 months. Mid-market is the
     default "now" segment for most FDI projects.
     ==================================================================== */
  {
    id: 'midmarket',
    label: 'Mid-Market',
    icon: '🚀',
    eyebrow: 'STAGE 1 ICP — NEAR-TERM',
    title: 'Mid-Market Targets',
    desc: 'Companies in the founder\'s near-term ideal customer profile. Lower friction to convert, faster sales cycles.',
    companies: [

      // ── 3. Placeholder mid-market, tier='high'. Same locked 5/4/5 shape.
      {
        name: 'Gamma Health',
        domain: 'gammahealth.example',
        subtitle: '[REPLACE: ≤18 words. Mid-market, vertical-relevant, why-they-fit phrase]',
        tier: 'high',
        tags: [
          { t: '[Industry sector]', c: 'neutral' },
          { t: '[Specific constraint]', c: 'stack' }
        ],
        overview: '[REPLACE: 3–5 sentences.]',
        sections: [
          {
            title: 'Company Profile',
            rows: [
              ['Industry', '[X]'],
              ['Revenue', '[$X]'],
              ['Employees', '[X]'],
              ['{{PROFILE_ROW_4}}', '[X]'],
              ['{{PROFILE_ROW_5}}', '[X]']
            ]
          },
          {
            title: '{{SECTION_2_LABEL}}',
            rows: [
              ['Use Cases', '[X]'],
              ['Current Stack', '[X]'],
              ['Pain Points', '[X — CFO language first]'],
              ['Estimated Spend', '[$X–$Y]']
            ]
          },
          {
            title: 'GTM Strategy',
            rows: [
              ['Approach', '[X]'],
              ['Key Evidence', '[X]'],
              ['Urgency Level', 'HIGH'],
              ['Target Buyer', 'Buyer: [persona]. Champion: [persona].'],
              ['Messaging Angle', '[X]']
            ]
          }
        ],
        contacts: [],
        signal_score: 4,
        signals: ['[Signal 1]', '[Signal 2]'],
        signal_types: ['positive', 'positive'],
        opp_reason: '[Reason]',
        competitive_distress: 4,
        distress_reason: '[Reason]',
        data_residency: 4,
        residency_reason: '[Reason. Score 5 requires wow-shape evidence.]',
        gtm_thesis: '[REPLACE: 3-sentence narrative.] <strong>Buyer:</strong> [persona].'
      },

      // ── 4. Placeholder mid-market, tier='med'.
      {
        name: 'Delta Finance',
        domain: 'deltafin.example',
        subtitle: '[REPLACE: ≤18 words]',
        tier: 'med',
        tags: [
          { t: '[Industry sector]', c: 'neutral' }
        ],
        overview: '[REPLACE: 3–5 sentences.]',
        sections: [
          {
            title: 'Company Profile',
            rows: [
              ['Industry', '[X]'],
              ['Revenue', '[$X]'],
              ['Employees', '[X]'],
              ['{{PROFILE_ROW_4}}', '[X]'],
              ['{{PROFILE_ROW_5}}', '[X]']
            ]
          },
          {
            title: '{{SECTION_2_LABEL}}',
            rows: [
              ['Use Cases', '[X]'],
              ['Current Stack', '[X]'],
              ['Pain Points', '[X — CFO language first]'],
              ['Estimated Spend', '[$X–$Y]']
            ]
          },
          {
            title: 'GTM Strategy',
            rows: [
              ['Approach', '[X]'],
              ['Key Evidence', '[X]'],
              ['Urgency Level', 'MED'],
              ['Target Buyer', 'Buyer: [persona]. Champion: [persona].'],
              ['Messaging Angle', '[X]']
            ]
          }
        ],
        contacts: [],
        signal_score: 3,
        signals: ['[Signal]'],
        signal_types: ['positive'],
        opp_reason: '[Reason]',
        competitive_distress: 3,
        distress_reason: '[Reason]',
        data_residency: 3,
        residency_reason: '[Reason]',
        gtm_thesis: '[REPLACE: 3-sentence narrative.] <strong>Buyer:</strong> [persona].'
      },

      // ── 5. Placeholder mid-market, tier='low'. Speculative pattern-match.
      {
        name: 'Epsilon Logistics',
        domain: 'epsilonlogistics.example',
        subtitle: '[REPLACE: ≤18 words]',
        tier: 'low',
        tags: [
          { t: '[Industry sector]', c: 'neutral' }
        ],
        overview: '[REPLACE: 3–5 sentences.]',
        sections: [
          {
            title: 'Company Profile',
            rows: [
              ['Industry', '[X]'],
              ['Revenue', '[$X]'],
              ['Employees', '[X]'],
              ['{{PROFILE_ROW_4}}', '[X]'],
              ['{{PROFILE_ROW_5}}', '[X]']
            ]
          },
          {
            title: '{{SECTION_2_LABEL}}',
            rows: [
              ['Use Cases', '[X]'],
              ['Current Stack', '[X]'],
              ['Pain Points', '[X — CFO language first]'],
              ['Estimated Spend', '[$X–$Y]']
            ]
          },
          {
            title: 'GTM Strategy',
            rows: [
              ['Approach', '[X]'],
              ['Key Evidence', '[X]'],
              ['Urgency Level', 'COLD'],
              ['Target Buyer', 'Buyer: [persona]. Champion: [persona].'],
              ['Messaging Angle', '[X]']
            ]
          }
        ],
        contacts: [],
        signal_score: 2,
        signals: ['[Signal]'],
        signal_types: ['positive'],
        opp_reason: '[Reason]',
        competitive_distress: 2,
        distress_reason: '[Reason]',
        data_residency: 2,
        residency_reason: '[Reason]',
        gtm_thesis: '[REPLACE: 3-sentence narrative.] <strong>Buyer:</strong> [persona].'
      }

    ]
  }

  // To add an Enterprise segment (Stage 2 ICP, stretch), copy the Mid-Market
  // block, change id to 'enterprise', label to 'Enterprise', and populate
  // with stretch ICP companies. See TEMPLATE_GUIDE.md → "Segment Strategy".

];


/* ────────────────────────────────────────────────────────────────────────
   CONTACT_MAP — per-company warm-intro mapping
   ────────────────────────────────────────────────────────────────────────
   Schema:
     "<Company name>": [
       {
         name: "Person name",
         title: "Job title",
         type: "technical" | "business",
         linkedin: "https://linkedin.com/in/...",
         connections: [
           { person: "<Primary team member>", strength: "warm" | "possible" }
         ]
       }
     ]
   Empty array means no contacts mapped yet — UI handles gracefully.
   The keys here MUST exactly match a SEGMENTS[].companies[].name.
   ──────────────────────────────────────────────────────────────────────── */
const CONTACT_MAP = {
  "Acme Corp": [
    { name: "Jane Doe", title: "VP of Engineering", type: "technical", linkedin: "https://linkedin.com/in/example", connections: [] }
  ],
  "Beta Industries": [],
  "Gamma Health": [
    { name: "John Smith", title: "Director of AI", type: "business", linkedin: "https://linkedin.com/in/example2", connections: [] }
  ],
  "Delta Finance": [],
  "Epsilon Logistics": []
};


/* ────────────────────────────────────────────────────────────────────────
   COMPANY_SOURCES — primary references per company
   ────────────────────────────────────────────────────────────────────────
   Schema:
     "<Company name>": [
       { name: "Source description", url: "https://..." }
     ]
   Verify URLs are live. These render as clickable list at the bottom of
   each company's detail view, so credibility matters.
   ──────────────────────────────────────────────────────────────────────── */
const COMPANY_SOURCES = {
  "Acme Corp": [
    { name: "Acme 10-K Annual Filings — SEC EDGAR", url: "https://www.sec.gov/" },
    { name: "Acme Engineering Blog — [Topic]", url: "https://example.com/" }
  ],
  "Beta Industries": [],
  "Gamma Health": [],
  "Delta Finance": [],
  "Epsilon Logistics": []
};


/* ────────────────────────────────────────────────────────────────────────
   JOB_LISTINGS — Hiring evidence per company (verified roles + active reqs)
   ────────────────────────────────────────────────────────────────────────
   Schema:
     "<Company name>": [
       { title: "Job title", team: "Posting" | "Verified Role",
         techs: "Comma-separated technologies", url: "https://...",
         date: "Active 2026" | "Verified Active 2026" }
     ]
   Two entry types:
     - team: "Posting"        → active open req from Sumble / careers / LinkedIn / ATS (Phase 6j Steps 1-5)
     - team: "Verified Role"  → verified named role-bearer mined from Webset
                                role-evidence enrichment (Phase 6j Step 0).
                                Doesn't depend on basic-Exa MCP credits;
                                survives the F11 cascade (basic-Exa 402).
   Both types feed computeJobSignal() and the Hiring axis. The renderer's
   reason text in index.html distinguishes them. Specific tech/title keywords
   matched against HIRING_KEYWORD_REGEX (Phase 5 artifact #2) raise the score.
   For new verticals, UPDATE THE REGEX in index.html → computeJobSignal().
   ──────────────────────────────────────────────────────────────────────── */
const JOB_LISTINGS = {
  "Acme Corp": [
    { title: "Senior Engineer — [Domain]", team: "Posting", techs: "[Tech 1, Tech 2, Tech 3]", url: "https://example.com/jobs/1", date: "Active 2026" }
  ],
  "Beta Industries": [],
  "Gamma Health": [
    // Step-0 verified role example (mined from Webset role-evidence enrichment):
    { title: "VP of Domain Operations", team: "Verified Role", url: "https://www.linkedin.com/in/example", date: "Verified Active 2026" },
    { title: "Director of AI — Open Roles", team: "Posting", techs: "[Tech 1, Tech 2]", url: "https://example.com/jobs/specific-req-id", date: "Active 2026" }
  ],
  "Delta Finance": [],
  "Epsilon Logistics": []
};


/* ────────────────────────────────────────────────────────────────────────
   RESIDENCY_MAP — vertical-specific axis-2 scoring
   ────────────────────────────────────────────────────────────────────────
   Schema:
     "<Company name>": { score: 1–5, reason: "Explanation string" }

   IMPORTANT: This collection is named "RESIDENCY_MAP" for legacy reasons
   (Valar's axis 2 was Data Residency). For new projects, the axis may be:
     - Switching Cost (B2B SaaS replacement)
     - Trust Gap (consumer health, fintech)
     - Compliance Burden (regulated verticals)
     - Workflow Lock-in (enterprise tooling)

   The data field name (`data_residency` on Company objects, RESIDENCY_MAP
   here) stays the same — only the LABEL in the UI changes. See the
   comment block at the top of the <script> tag in index.html.
   ──────────────────────────────────────────────────────────────────────── */
const RESIDENCY_MAP = {
  "Acme Corp": { score: 4, reason: "[REPLACE: axis-2 explanation tying score to specific evidence]" },
  "Beta Industries": { score: 3, reason: "[REPLACE]" },
  "Gamma Health": { score: 5, reason: "[REPLACE]" },
  "Delta Finance": { score: 3, reason: "[REPLACE]" },
  "Epsilon Logistics": { score: 2, reason: "[REPLACE]" }
};


/* ────────────────────────────────────────────────────────────────────────
   PRIMARY_TEAM — roster of the Primary team, for reference only.
   ────────────────────────────────────────────────────────────────────────
   NOTE: the UI no longer synthesizes any warm intros from this list. Empty
   CONTACT_MAP[].connections stays empty — no relationships are invented.
   Warm paths in the Network tab come solely from window.NETWORK_DATA.
   ──────────────────────────────────────────────────────────────────────── */
// Fictional sample roster. The dashboard UI does not consume PRIMARY_TEAM (warm
// paths come solely from window.NETWORK_DATA); keep this fictional — never ship
// a real internal roster to a public build.
const PRIMARY_TEAM = ['Alex Partner', 'Robin Vega', 'Dana Cole', 'Sky Morgan'];


/* ────────────────────────────────────────────────────────────────────────
   Exports
   ──────────────────────────────────────────────────────────────────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ROW_SOURCES, SEGMENTS, CONTACT_MAP, COMPANY_SOURCES, RESIDENCY_MAP, JOB_LISTINGS, PRIMARY_TEAM };
}
