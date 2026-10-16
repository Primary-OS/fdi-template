# TEMPLATE_GUIDE.md, Structural Decisions for FDI Dashboards

**Audience:** Claude (running the build skill) and humans reviewing the template.
**Purpose:** For each structural element of the dashboard, this doc tells you **what it does, when to use it, when to skip it, and what data it requires.**

If `AI_INSTRUCTIONS.md` is the operating manual, this is the reference encyclopedia. Consult it whenever you're making a "should this section be here?" decision.

---

## 1. Segments (top-level tabs)

### What it does
Each segment becomes a top-level tab on the dashboard (Active Pipeline, Mid-Market, Enterprise, etc.). Companies belong to exactly one segment.

### Default segments (Valar pattern)
- **Active Pipeline**, Signed design partners + named pipeline accounts.
- **Mid-Market**, Stage 1 ICP, near-term targets.
- **Enterprise**, Stage 2 ICP, stretch targets.

### When to use the default
- Founder has signed design partners or named pipeline accounts AND a clear two-stage ICP (now / later).
- The "Stage 1 vs Stage 2" framing maps cleanly onto company size.

### When to deviate
- **Pre-pipeline founder**, Drop the Pipeline segment entirely. Two-segment dashboard (Mid-Market + Enterprise) is fine.
- **Single ICP founder**, Collapse to one segment. The tabs become irrelevant; show a single landing.
- **Geographic segmentation matters**, Replace size-based segments with geo (NAM / EMEA / APAC).
- **Vertical segmentation matters**, Replace with vertical buckets (Healthcare / Fintech / Retail). Especially common when the founder's wedge cuts across company sizes within each vertical.

### What data it requires
- Each segment object needs: `id`, `label`, `eyebrow`, `title`, `desc`, `companies[]`, plus the icon SVG.
- Companies in a segment all share the schema (so they render in the same card grid).

---

## 2. Sections within a company card

### What they do
The detail view of each company is divided into sections. Default 3:

1. **Company Profile**, Industry, revenue, employees, plus the two facts that matter most to this founder's buyers. Static facts.
2. **{Opportunity} section** (default name: "Inference Opportunity"), Use cases, current stack, pain points, estimated spend. The "why this account fits the thesis" content.
3. **GTM Strategy**, Approach, key evidence, urgency, target buyer, messaging angle. The "how to actually go win this account" content.

### When to keep all three
- The founder is selling into infrastructure, platform, or technical buyers.
- You have enough research depth to populate all three meaningfully.

### When to deviate
- **Add a "Competitive Landscape" section**, When the company is currently using a specific competitor and the wedge is replacement.
- **Add a "Workflow Map" section**, For workflow-automation founders, walking through the current process.
- **Add a "Decision Unit" section**, For enterprise sales motions where 5+ stakeholders are involved.
- **Drop the Opportunity section**, If the value prop is so obvious it doesn't need a section (rare).
- **Rename the Opportunity section**, Almost always do this. "Inference Opportunity" is Valar-specific. Try: "Workflow Opportunity," "Replacement Opportunity," "Automation Opportunity," "[Founder Product] Opportunity."

### What data it requires
- `sections[]` array of `{ title: string, rows: [[label, value], ...] }`
- Rows render as 2-column key/value pairs. The label column is monospace, value column has paragraph text.

---

## 3. Adapting Signal Categories (THE MOST IMPORTANT SECTION)

The dashboard scores each company across 4 axes that combine into a 0–100 signal score. The math is generic; the labels are vertical-specific.

### The 4 axes and how to relabel them

| Data field | Default label (Valar) | What it actually measures | Suggested labels by vertical |
|------------|----------------------|---------------------------|------------------------------|
| `competitive_distress` | Inference Pain | Workload-specific operational pain that the founder's product solves | "Workflow Pain" (workflow), "Compliance Burden" (regulated), "Incumbent Pain" (replacement), "Scaling Pain" (infra), "Data Pain" (data tooling) |
| `data_residency` | Data Residency | Structural reason a default solution fails this account | "Switching Cost" (B2B SaaS replacement), "Trust Gap" (consumer health/fintech), "Data Sovereignty" (regulated), "Workflow Lock-in" (enterprise tools), "Custom Need" (verticalized) |
| `signal_score` | Buying Trigger | Time-bound reason this account is winnable NOW (earnings comments, hiring spikes, partnerships, RFPs) | Usually keep "Buying Trigger", it's generic enough. Optionally: "Timing Signal," "Window Now." |
| `hiring` (computed) | Hiring | Validation that this company is staffing up against the problem | Usually keep "Hiring." Optionally: "Investment Signal" or rename to whatever the leading-indicator job category is for this vertical. |

### How to make the swap

For each project, you (Claude) need to:

1. **Decide the labels** based on the vertical and the founder's language.
2. **Update `index.html`**, search for the label strings in `buildScoreTips()` and section headers (see the giant comment block at the top of `<script>`).
3. **Update the hiring keyword regex** in `computeJobSignal()` to match your vertical. Valar's regex catches inference-related keywords; yours should catch your vertical's leading-indicator job titles/skills.
4. **Document the choice** in `BUILD_NOTES.md` so the user understands why these labels.

### Worked example: rebranding for a healthcare workflow founder

Imagine the founder is automating prior authorization workflows for hospitals.

- Axis 1 ("Inference Pain") → **"Workflow Pain"** (manual prior-auth backlog, denial rates, AR days).
- Axis 2 ("Data Residency") → **"Compliance Burden"** (HIPAA, state-specific regulations, payer contracts).
- Axis 3 ("Buying Trigger") → keep, generic.
- Axis 4 ("Hiring") → keep, but update regex to match: `prior auth|denial mgmt|RCM|revenue cycle|coding`.

The dashboard now reads like it was built for a healthcare founder, not for Valar.

### Breaking score ties

Axes grade in whole 0–5 points, so the /100 composite collides constantly — the canonical case is five accounts all landing on 17/20 axis totals → all 85. When two or more companies tie, rank the tied group by (1) cited evidence strength on the wow axis (primary/first-party beats inferred), (2) larger cited scale, (3) more total sources, (4) alphabetical as the final deterministic fallback — then give each a distinct integer `composite: <n>` override on its data.js company object. The overrides must be **collision-free and order-preserving across the whole board**: place them strictly between the nearest distinct composites above and below the tied cluster so none equals another account's score and none leapfrogs a higher account or drops below a lower one (e.g. a lone 85 tie between a 90 and an 80 → 87/86/85/84/83; if the integer gap is too tight for the count, widen it by also overriding the bracketing non-tied accounts, staying within the tier). `computeSignal()` returns the override first (clamped 0–100), so the card number, tooltip total, and tier all follow it — and the tooltip's axis breakdown still shows the raw 0–5 dots and the "weighted blend" wording (intentional; the override is a display-order tiebreak, not a re-weighting). Carry the same numbers into `build-data.js` `companies[].score`. Use `composite` for genuine ties only, never to rescore a non-tied account.

---

## 4. The Network + Contacts tabs (engine data, do not build per-founder)

**Rewritten 2026-07-16. Network UX v3 2026-07-17.** These are now standing, fully data-driven tabs — NOT a keep/drop decision and NOT built from CONTACT_MAP.

### What they do
- **Network** — a radial warm-path map per target account: the company at center, Primary connector hubs around it, contact dots fanned out; warmth-coded edges (green/amber/**red** for faint <40, fixed independent of the founder accent), animated flow dots, a boxed legend with a Map/List toggle, an **in-map filter bar** (top-left: seniority / warmth / last-contacted / connector — filters the graph AND the ranked list together), a **visual dot key** (left of the zoom buttons: ringed dot = works at the company, plain = elsewhere, size = seniority), a summary strip with clickable stats (incl. Strong-75+ / C-level-reachable), unified detail cards (dot-click contact card + hub-click connector card share one layout: inline LinkedIn under the name, close on outside-click/Escape, contact card lists every connector who can intro), a connector-centric view, and a ranked list below with a **Sort-only** toolbar (the other filters moved to the map bar).
- **Contact de-duplication:** each contact appears **once per company** (render-side `groupPaths`/`contactKey`), carrying all their connector paths; company view still shows a contact under each *distinct* connector who can intro them. Missing `contact_title` is **omitted** (no placeholder/em-dash).
- **Contacts** — every warm path flattened into a filterable rows table (search + warmth/seniority/connector/account/activity dropdowns), tier-grouped, row-expand to why+history, multiselect → bulk bar → saved lists (`fdi_lists_<slug>` in localStorage) + CSV export (Connectors column lists all intro paths).

### Data source (IMPORTANT)
Both are driven **solely** by `window.NETWORK_DATA` (from `network-data.js`), which the **FDI engine generates from real Affinity data** as a workflow step AFTER the build (`fetch-affinity-network.mjs`). The skill never writes it. They are NOT built from `CONTACT_MAP`/`PRIMARY_TEAM` and never synthesize/invent warm intros.

**Former-employee filtering:** the engine strips warm paths whose connector is no longer on the live primary.vc/people roster when it generates the data (audit trail in `summary.roster_filter` + `summary.excluded_connectors`; fails open if the roster can't be fetched). The template also has an `EXCLUDED_CONNECTORS = []` array at the top of the network IIFE — a **manual per-build override knob** that ships empty and normally stays empty. Only populate it for a one-off correction; names must match `paths[].connector` exactly.

### The only skill-side inputs that affect these tabs
- `data.js` `SEGMENTS[].companies[].name` — joined EXACTLY (character-for-character) to attach display metadata (subtitle/category/favicon).
- `data.js` `SEGMENTS[].companies[].domain` — the **Affinity join key** (canonical registrable domain, no `www`/path/subdomain). A wrong domain silently drops that account from both tabs.
- `{{PRODUCT_SLUG}}` — namespaces the Contacts saved-lists localStorage key.

### Local behavior
Absent `network-data.js` (every skill phase, and local preview), both tabs render a designed empty state — never an error. Do not "fix" the empty state, remove `<script src="network-data.js">`, or copy the dev fixture into the build root.

---

## 5. The Hiring sub-score

### What it does
Computes a 0–5 score per company based on count of relevant active job postings + presence of vertical-specific keywords in titles/skills. Rolls into the total signal score.

### When to keep
- Job postings are a leading indicator in the founder's vertical (true for almost all infra, platform, dev tools, and enterprise software founders).
- You have job-listing data populated for at least 50% of companies.

### When to drop
- Job postings aren't a meaningful signal (some niche verticals where the buyer doesn't broadcast hiring).
- You have very thin job data (UI shows zeros and feels unimpressive).

If dropping: zero out the `hiring` math contribution by setting `computeJobSignal()` to return `0` always, OR by re-weighting the score formula. Update the score tooltip text to reflect the new weighting.

---

## 6. Tier ('high' / 'med' / 'low')

### What it does
Filter chip + sort key on the home view. Shapes which accounts surface first.

### How to assign tiers
- **'high'**, All 4 axes scored 4+. Or signed design partner. These are the founder's hottest opportunities.
- **'med'**, Mixed scores, generally 3+ on most axes. Real opportunity, needs more diligence.
- **'low'**, Speculative, weak signal, or stretch. Worth tracking, not pursuing.

Distribution sanity check: in a healthy 20-company dashboard, expect roughly 5–8 high, 8–10 med, 4–7 low. If everything is 'high', tiers are meaningless. If everything is 'low', the founder doesn't have an actionable list.

---

## 7. Tags

### What they do
Small chips below the company name. Three styling variants:
- `c: 'neutral'`, Gray. Industry/sector facts.
- `c: 'stack'`, Subtle highlight. Constraint or technology tag (the "why default solutions fail this company" tag).
- `c: 'brand'`, Founder's accent color. Reserved for tags that mark a relationship to the founder ("Design Partner," "In Pipeline," etc.).

### Pattern
- Always include 1 sector/industry tag.
- Include 1 stack tag if there's a specific compliance/data/technology constraint that explains why the founder wins.
- Include 1 founder-color tag if the company has a relationship to the founder (signed, in pipeline, prospect).

### Anti-pattern
- More than 5 tags makes the card noisy.
- Generic tags like "AI" or "Tech", be specific. "AIOps" is a tag, "AI" is not.

---

## 8. The `gtm_thesis` field

### What it does
The single most important piece of copy on the dashboard. Renders as a paragraph at the top of each company card and again in detail view.

### What it should contain
- A 2–3 sentence narrative answering: "Why this company, why now, what's the wedge?"
- Founder voice, splice verbatim quotes from CONTEXT.md if possible.
- Buyer/champion call-out at the end ("**Buyer:** Director of Engineering, **Champion:** AI Platform Lead").
- Specific named accounts as references ("BigPanda is the canonical AIOps reference for the BYOC thesis. Land already executed, focus is on co-developing case study evidence...").

### What it should NOT contain
- Generic startup language ("disrupting the market," "category-defining").
- Hedges ("could potentially," "may benefit from").
- Marketing taglines.
- Anything that could be said about any company in this segment.

### Test
Strip the company name from the gtm_thesis. Could you swap any other company's name in and have it still make sense? If yes, it's not specific enough.

---

## 9. Field-by-field craft patterns (apply the *patterns*, not the vocabulary)

The patterns below are extracted from the V1 Valar dashboard, the inference-vertical reference build. Every example is real V1 copy. **Apply the patterns to your own founder's data, but never copy the vocabulary.** A non-Valar build that uses Valar's wording (Inference Pain, Data Residency, "tried Fireworks/Together/Baseten/Modal", BYOC inference, etc.) is the F11 failure mode that SKILL.md Output Style Rule #14 ("Reference build is scaffolding, not content") explicitly prevents.

For a non-inference build:
- The **subtitle pattern** (9.1) — *[what the company is], [why-they-fit phrase], [relationship status]* — works for any vertical. Substitute your founder's vertical-appropriate "why-they-fit phrase" (e.g., "AIOps platform with growing inference spend" → "regional manufacturer with $30M annual unplanned-downtime cost" or "national health insurer with HIPAA-bound EHR pipeline").
- The **gtm_thesis pattern** (9.3) — anchor sentence + motion sentence + buyer/champion call-out — works for any vertical. The Valar example splices "data never leaves the firewall"; your build should splice the founder's own verbatim quotes from CONTEXT.md.
- The **locked field sets** (9.8) — Profile (5 rows), Section 2 (4 rows), GTM Strategy (5 rows) — apply universally. Section 2's *label* changes ("Inference Footprint" → "Workflow Footprint" → "Capex Footprint" → "Compliance Footprint" → etc.); the 4-row shape doesn't.
- The **source quality hierarchy** (9.12) — 6-target / 4-floor with Tier-1 primary record + ≥2 Tier-2 vertical-credible — works for any vertical, but **the Tier-2 source landscape varies by vertical** (engineering blogs for tech-forward; trade press + analyst notes for industrials; clinical trial registries + FDA filings for biotech; etc. — see SKILL.md Output Style Rule #12 for the full list).
- The **gtm_thesis durability rule** (9.3) — no named individuals, role types only — applies universally.
- The **antagonist exclusion** (9.10) — every CONTACT_MAP champion must NOT match a `**NOT [persona]**` callout in the gtm_thesis — applies universally; only the antagonist persona varies (ML eng for inference; controls engineers for industrials predictive-maintenance; clinical operations for biotech in some shapes).

The Valar examples below tell you *how the pattern works*. They don't tell you *what to write* for your founder. If your output reads as Valar with names changed, you've under-delivered.

### 9.1 `subtitle`, one line, dense, signal-rich

Subtitle is the sentence under the company name. The V1 pattern is consistent across all 30 entries: **[what the company is], [why-they-fit-Valar phrase], [Valar relationship status]**.

**Hard constraint: maximum 18 words.** If yours runs longer, the dashboard truncates it with "..." and the signal is lost. Cut financial metadata, cut hedges, cut anything that isn't doing one of the three jobs below.

V1 examples (all under 18 words):
- BigPanda (12 words): *"AIOps + incident management, signed design partner. Inference for autonomous incident triage on production telemetry data."*
- Qualcomm (14 words): *"Mobile silicon + on-device AI leader, IP-sensitive R&D inference workloads, named in Valar pipeline."*
- Mastercard (14 words): *"Payments network giant, 150B+ transactions/year, real-time inference for fraud + risk, PCI DSS-bound."*

The pattern works because every subtitle does three jobs in one sentence:
1. Names the business
2. Identifies the structural reason this company fits the founder's wedge
3. Marks the relationship status to the founder

**Anti-patterns** (don't):
- Generic descriptors: "Leading provider of X" gives no signal
- Marketing language: "Industry-defining innovator" gives no signal
- Vague relationship: "Potential customer" is useless; if it's a candidate, say what made it candidate-worthy
- **Stuffed parentheticals**: never include revenue, employee count, founding year, or other financial metadata in a subtitle. Bad: *"UK challenger bank ($1.6B FY25, 11M customers), UK-resident-only customer data, real-time fraud inference on payment hotpath..."* That data belongs in the Profile section, not the subtitle. The reader sees the subtitle for half a second; it should land one signal, not five.
- **Trailing ellipsis**: if the subtitle ends with "..." the truncation rule was violated. Rewrite shorter.

### 9.2 `overview`, 3-4 sentences, named-account positioning, ≤80 words HARD CAP

The overview paragraph that opens the company card. V1 pattern: **state the company's position in the founder's market story, then connect to the founder's thesis with named adjacencies**. Hard caps: **80 words max, 4 sentences max** (per SKILL.md Output Style Rule #15). Phase 7 self-check counts words and fails the entry if exceeded.

V1 BigPanda example, in full (64 words, 4 sentences):
> *"BigPanda is one of Valar's two named design partners (alongside Varonis). They run AI-driven incident management for enterprise IT teams, where customer telemetry data flowing through their AI pipelines is highly sensitive, it includes infrastructure topology, alert content, and incident context. Multi-tenant inference clouds are a non-starter. BigPanda's validation as a design partner anchors the BYOC inference thesis for AIOps and observability vendors broadly."*

Notice what this does:
- Names the relationship explicitly ("one of Valar's two named design partners (alongside Varonis)")
- Specifies the data sensitivity in concrete terms ("infrastructure topology, alert content, and incident context"), not abstract "their data is sensitive"
- Connects this single company to a category-level reference ("anchors the BYOC inference thesis for AIOps and observability vendors broadly")

The category connection is critical, it tells the founder why this company matters beyond itself.

**Anti-pattern (the Plural-build regression):** stacking 4-5 distinct factual claims into a 110-130 word essay paragraph. The Plural FDI Manulife overview shipped at 134 words because it tried to fit (a) named exec + (b) cluster scale + (c) AI mandate + (d) governance quote + (e) wow-shape rubric trace + (f) tier rationale into one block. Trade facts for narrative pacing — the dashboard's Profile + Section 2 + sources list already carry the facts; the overview's job is to position the company inside the founder's story.

**No `(a)/(b)/(c)` enumeration in overview** (per SKILL.md Output Style Rule #16). That tic is reserved for `residency_reason` where it traces the score-5 wow-evidence rubric. If you find yourself writing "(a)... (b)... and (c)..." in an overview, the content belongs in `residency_reason` instead — move it.

### 9.3 `gtm_thesis`, 2-3 sentences ending with a named buyer, ≤75 words HARD CAP

This is the single highest-leverage paragraph. Already covered in Section 8. Hard caps: **75 words max, 3 sentences max** (per SKILL.md Output Style Rule #15). Phase 7 self-check counts words and fails the entry if exceeded. The V1 patterns to internalize (all under 50 words):

**Land status + reference value + buyer call-out**

V1 BigPanda (47 words): *"BigPanda is the canonical AIOps reference for the BYOC thesis. Land already executed, focus is on co-developing case study evidence (cost reduction %, SLO improvement, deployment friction) that Valar uses to land peer accounts (Datadog, Splunk-adjacents, Sumo Logic). **Buyer:** Platform Engineering / Site Reliability lead."*

V1 Varonis: *"Varonis anchors the cyber/DSPM reference. Joint go-to-market motion to land CrowdStrike, SentinelOne, Wiz, Rubrik. **Buyer:** Security/Compliance leadership + Platform Engineering."*

V1 ABInBev: *"ABInBev advances the Fortune 500 multi-region BYOC narrative. Land via supply chain AI pilot, expand into marketing + CX. **Buyer:** Platform Engineering or Chief Data/AI Officer (NOT marketing AI team)."*

Three patterns to extract:
1. **First sentence** anchors the company in the founder's story ("X is the canonical Y reference for Z thesis"). Be specific about the role this company plays.
2. **Middle sentence(s)** describe the next-step motion, what concrete action does this account enable? "Land here = open peer accounts X, Y, Z" is a powerful pattern when applicable.
3. **Buyer call-out** uses bold. **NOT** is critical, explicit "NOT [persona]" guidance reflects founder antagonist warnings (V1 used "NOT marketing AI team," "NOT research-floor AI team," "NOT ML eng", all from Tom's interview).

**Durability rule (CRITICAL): the GTM thesis must survive personnel changes.**

The thesis describes *why this company is a structural fit*. Specific named people belong in `CONTACT_MAP` (the Connections section), which is the dynamic layer — people leave, change roles, switch companies. The strategic layer should hold even if every contact rotated tomorrow.

**Buyer and Champion in the gtm_thesis are personas, not specific names.** V1 BigPanda's "Platform Engineering / Site Reliability lead" is a role type that survives turnover. "John Morgan, Managing VP Head of Product" is a specific human being who could leave next month, taking three sentences of your thesis with him.

| ✅ Durable (use these) | ❌ Brittle (move to CONTACT_MAP) |
|---|---|
| `**Buyer:** Platform Engineering leadership` | `**Buyer:** John Morgan, Managing VP Product` |
| `**Champion:** Distinguished Engineer / Staff Eng cohort` | `**Champion:** Vivek Gupta (warm via Alex)` |
| `Primary has multiple warm contacts spanning AI Eng, Platform, Product` | `8 Primary network warm contacts spanning... Lead with Vivek Gupta` |
| `Tom's named pipeline pick` | `Tom's pick — and Gaby's framing of "..." sits squarely on Capital One` |

**What's allowed in the thesis:**
- Persona/role-type buyer + champion (always)
- Antagonist exclusions as roles ("NOT ML engineering function broadly")
- Verbatim founder quotes from CONTEXT.md (these are strategic anchors, not personnel facts)
- Aggregate warm-contact counts as attributes ("Primary has 8 warm contacts here") — but framed as descriptive, not as the strategy
- Founder relationship status if it's structural ("signed design partner", "named pipeline pick")

**What belongs in CONTACT_MAP, not the thesis:**
- Specific named individuals at the target company (John Morgan, Vivek Gupta)
- Specific named individuals at Primary who can intro (Alex, Charles, Gaby)
- Specific warm-intro paths ("warm via Alex")
- Department-specific contact details ("Vivek Gupta is the Distinguished Engineer in the Enterprise AI org")
- Comparative warmth claims that hinge on personnel ("highest-warmth account in the FDI")

**Anti-pattern from May 5 V2 Capital One:** *"Capital One is the highest-warmth Stage-2 account in the entire FDI: a tech-forward US bank with public production multi-agent AI, an EVP Chief Scientist running enterprise AI, and 8 Primary network warm contacts spanning AI Eng, Platform, and Product... **Buyer:** Managing VP, Head of Product, Enterprise AI/ML Platforms (John Morgan). **Champion:** Distinguished Engineer (Vivek Gupta, warm via Alex)."*

Three brittle pillars: "highest-warmth" (depends on relative contact warmth across companies), "EVP Chief Scientist running enterprise AI" (Prem Natarajan specifically), the named buyer + champion + intro path. If Prem leaves Capital One, two sentences invalidate. If Alex leaves Primary, the intro path breaks.

**Better V3 version (durable):** *"Capital One is the most AI-forward major bank in the US: production multi-agent AI shipped publicly, dedicated enterprise AI leadership at the EVP level, and a cloud-first but security-obsessed culture that creates a natural fit for Valar's in-cloud deployment under bank governance. Tom's named pipeline pick. Primary network depth here is unusually strong (multiple warm contacts across AI Eng, Platform, and Product). **Buyer:** Platform / Enterprise AI/ML leadership. **Champion:** Distinguished/Staff Engineer cohort inside Enterprise AI. NOT ML engineering function broadly — sequence through platform and product first."*

Same outbound utility, but every claim survives if the named individuals rotate. The names go in CONTACT_MAP where they belong.

**Anti-pattern (the Plural-build bloat regression):** the gtm_thesis stuffed with anchor + motion + verbatim founder quote + Buyer + Champion + "NOT [persona]" + sequencing guidance, all in one paragraph. The Plural FDI shipped at avg 132 words across 10 entries (3.3× the V1 baseline of 40). Diagnosis: the subagent treated gtm_thesis as the place to surface every dimension of the dashboard's analytical work — but those dimensions are *already* surfaced by the GTM Strategy section, the residency_reason, the CONTACT_MAP, and the tags. The gtm_thesis's job is to pose the strategic question (`why this company specifically, why now`); the dashboard's other fields answer it. When the gtm_thesis exceeds 75 words, the answer is leaking into the question.

**Recovery rule:** if a gtm_thesis runs long, move (in this order): the Buyer/Champion/NOT triplet to a single line; the verbatim founder quote splice (keep it — it's the strongest pattern, but compress to 5-10 words); the sequencing guidance ("sequence through X first") to the GTM Strategy → Approach row, where it earns space; the wow-evidence rubric trace ("(a)/(b)/(c)") to residency_reason. What remains is the anchor + motion you started with.

### 9.4 `tags`, 3-5 chips, mixed colors

Tag color vocabulary observed in V1: `Valar` / `brand` (founder accent, relationship status), `stack` (subtle highlight, technical/constraint), `hw` (harder constraint), `hiring` (hiring signal), `oss` (open-source), `neutral` (gray, factual).

V1 GM (Cruise) tag set:
```javascript
[
  { t: 'Automotive', c: 'neutral', tip: 'Major automaker, formerly operated Cruise autonomous division' },
  { t: 'GCP + AWS', c: 'stack', tip: 'GCP primary, some AWS workloads' },
  { t: 'ADAS / Autonomy', c: 'stack', tip: 'Advanced driver assistance and autonomous vehicle AI' },
  { t: 'Cost Restructuring', c: 'hw', tip: '$2B Cruise spend being restructured for efficiency' },
  { t: 'Hiring: ML Platform', c: 'hiring', tip: 'Rebuilding ML platform team post-Cruise restructuring' }
]
```

Patterns:
- **Tooltips are required if the tag is non-obvious.** "AIOps" is self-explanatory; "Data-Sensitive" needs a tip explaining why ("Customer telemetry data cannot be exposed to multi-tenant inference").
- **Hiring tags are prefixed**: `'Hiring: ML Platform'` not just `'ML Platform'`.
- **Color reflects role, not aesthetic.** Don't pick `c:` based on what looks nice, pick based on what the tag means.

**Banned tag values** (these duplicate information already shown elsewhere in the UI, so they add zero signal):
- `Stage-1 ICP`, `Stage-2 ICP`, `Stage 1`, `Stage 2`, or any segment-classification tag. The segment is already shown by which tab the company is on.
- `Pipeline`, `Mid-Market`, `Enterprise`. Same reason.
- `Target`. Every company in the dashboard is a target by definition.
- `ICP`, `In ICP`. Same reason: every company in the dashboard is an ICP fit.
- Generic descriptors like `B2B`, `SaaS`, `Tech` unless they're disambiguating from another segment.

What tags SHOULD reference: product names ("Bits AI", "Process Copilot"), technical stack ("vLLM", "Multi-cloud + Bare Metal"), constraints ("PCI DSS Level 1", "HIPAA-bound"), relationship status ("Signed Design Partner", "Named in Pipeline"), or hiring signals (prefixed with "Hiring:").

When the founder has an explicit "ML eng = antagonists" guidance, do NOT tag those teams as positive. The color discipline reinforces the founder's actual GTM strategy.

### 9.5 `signals[]`, `signal_types[]`, `opp_reason`, axis 3 evidence trio

The Opportunity axis (axis 3) renders three things together: the score (0-5), the bullet signals, and the reasoning paragraph. V1 pattern: **3-4 short signal bullets + 1-2 sentence reasoning that ties them together**.

V1 Mastercard:
- `signal_score: 3`
- `signals: ['Extreme-scale real-time inference workload (150B+ transactions)', 'Expanding into generative AI features', 'PCI DSS creates data sovereignty requirement']`
- `signal_types: ['positive', 'positive', 'neutral']`
- `opp_reason: "One of the world's most demanding inference workloads. PCI compliance creates a natural fit for Valar's in-cloud model. Challenge is that Mastercard has deep in-house expertise, so Valar needs to demonstrate clear value beyond what their team has built."`

Notice the honesty, `opp_reason` flags the *challenge* (Mastercard's in-house expertise) alongside the opportunity. V1 didn't paint everything as a slam dunk. That credibility carries through to the founder's reading of the dashboard.

`signal_types` values: `'positive'` (green tone), `'negative'` (red, used for distress signals or buying pain), `'neutral'` (gray, factual but not necessarily positive).

### 9.6 `competitive_distress`, `distress_reason`, `distress_signals[]`, axis 1 (or your renamed axis 1)

The Inference Pain axis. Same trio pattern as 9.5. V1 BigPanda:
- `competitive_distress: 4`
- `distress_reason: "BigPanda has the inference workload + data sensitivity that makes managed APIs non-viable. Hyperscaler defaults aren't optimized for AIOps cost profile."`
- `distress_signals: ['Customer telemetry cannot use multi-tenant inference', 'AIOps margins compress with rising AI compute']`
- `distress_signal_types: ['negative', 'negative']`

Note: distress signals are usually marked `'negative'` because they're describing a pain that the buyer is experiencing, "negative" in this context means "buyer feels this as bad."

### 9.7 `data_residency`, `residency_reason`, `residency_signals[]`, axis 2 (or your renamed axis 2)

Same pattern. V1 Capital One residency_reason:
> *"Federal banking regulations on AI model governance, OCC supervisory expectations on AI risk management, customer financial data sovereignty requirements. PCI DSS Level 1 + SOX + state banking regulations = inference cannot route through multi-tenant clouds."*

Notice the **specificity of the regulatory citation**, OCC, PCI DSS Level 1, SOX, state banking. This is what separates a credible residency claim from hand-waving. When the Webset returns a residency enrichment, parse out the specific regulations and compliance framework names, those are what go into `residency_reason`.

### 9.8 `sections`, 3 sub-tables of fact rows

Each company card has 3 sections (default: Profile / Inference Footprint / GTM Strategy). Each section is a list of `[label, value]` row pairs.

**Profile section: exactly 5 rows, no more.** Rows 1-3 are locked: **Industry, Revenue, Employees**. Rows 4-5 are build-specific: the two facts that matter most to THIS founder's buyers, chosen once in Phase 5 and used with the same labels on every account. A software or AI-infrastructure founder keeps **Cloud Provider, AI Maturity**; an energy founder might use **Asset Type, Energy-Program Maturity**; a healthcare-workflow founder **EHR Vendor, Payer Mix**. Never ship the software pair to a non-software market: Plexa (10/13) showed "Cloud Provider: Warehouse, flex, and high-bay industrial real estate" on every energy account. Nothing in the dashboard reads these labels, so rename freely. The last visible row should be a relationship status, but rather than adding a 6th profile row, that lives in the company `tags` array as a brand-color chip. Adding extra profile rows bloats the card without earning the space.

**Banned profile fields** (these add no signal):
- `Founded` (year). Founding year is rarely relevant to a buyer profile.
- `Headquarters`. Already in the subtitle for most companies; redundant.
- `Valar Status` / `[Founder] Status`. Redundant with the segment tab AND the relationship tag in the chip row.
- `Stage`, `ICP Tier`, or any segment-classification field. Redundant with the tab.
- `Business Type` (B2B vs B2C). Implicit in the founder's ICP.

V1 Datadog Profile section (5 fields, this is the bar; a software buyer, so rows 4-5 are Cloud Provider / AI Maturity):
```javascript
[
  ['Industry', 'Infrastructure / Cloud Observability'],
  ['Revenue', '~$2.8B (FY2025)'],
  ['Employees', '~7,000'],
  ['Cloud Provider', 'Multi-cloud (AWS, GCP, Azure) + own bare metal data centers for the data plane'],
  ['AI Maturity', 'Very advanced. Bits AI in production, extensive ML for anomaly detection and log analysis, dedicated AI/ML research team, deep infrastructure expertise.']
]
```

Patterns:
- **Values are sentences when the field needs nuance**, not always single-word answers. "AI Maturity" is `'Very advanced. Bits AI in production, extensive ML for anomaly detection...'` not just `'Very advanced'`. The sentence is the evidence for the rating.
- **Cite source materials inline** when the claim is non-obvious. The Webset enrichment text fields contain inline source URLs (pattern: `fact text | URL`); parse them out into ROW_SOURCES (see 9.9). Empty citations are fine; wrong citations are worse than none.
- **Name the company's actual AI product** in AI Maturity (software builds) if there is one (Datadog → Bits AI; Celonis → Process Copilot; Salesforce → Einstein). The named product is the strongest possible signal of AI maturity and gives the founder something specific to anchor outbound on.

**Inference Footprint section: exactly 4 rows.** Locked field set is **Use Cases, Current Stack, Pain Points, Estimated Spend**.

V1 Datadog Inference Footprint section (the bar):
```javascript
[
  ['Use Cases', 'Bits AI natural language querying, intelligent log summarization, anomaly detection and root cause analysis, automated alert correlation, infrastructure recommendation engine.'],
  ['Current Stack', 'Custom inference infrastructure across cloud and bare metal. Published engineering blog on LLM serving architecture. Likely custom serving with optimization layers.'],
  ['Pain Points', 'Inference costs for Bits AI significantly impacting gross margins. Hybrid infrastructure (cloud + bare metal) adds optimization complexity. Customer telemetry data sensitivity constrains where inference can run.'],
  ['Estimated Spend', '$40–80M annually on inference compute (estimated from margin impact disclosure and revenue scale)']
]
```

**Pain Points framing rule (CRITICAL):** lead with the financial consequence, then the technical/regulatory constraint. The buyer thinks in dollars and margins; translate to that language.

The V1 Datadog field works because the FIRST sentence is *"Inference costs for Bits AI significantly impacting gross margins."* That's a CFO sentence. A buyer reads that and feels the pain. The constraint enumeration follows.

The May 5 V2 Celonis Pain Points was *"Customer ERP custody contracts; FedRAMP authorization boundary; EU GDPR + DE BDSG; multi-cloud means multi-stack inference."* Four constraints listed with semicolons, no financial framing, no buyer voice. The reader has to translate it themselves into a felt problem; most readers won't.

Pain Points framing template:
1. **First sentence:** the financial pain (margin compression, COGS impact, cost overruns, opex pressure, gross-margin drag, cash-burn rate). Use specific dollar phrasing if it's defensible.
2. **Following sentences:** the technical/regulatory/contractual reasons that pain exists.

If the public data doesn't support a financial pain claim, the field should still lead with the *consequence* in business language ("Inference cost is a margin headwind for the AI features cohort") rather than enumerating constraints. Constraints alone are not pain.

**Estimated Spend rules:**
- **Always a range**, never a point estimate. "$40–80M annually" is honest about uncertainty; "$57M" pretends to precision the data doesn't support.
- **Always show the estimation method in parentheses** when the figure is derived rather than disclosed. "(estimated from margin impact disclosure and revenue scale)" is the V1 Datadog pattern. "(estimated from customer count × inference per customer estimates)" or "(triangulated from 10-K AI mentions and engineering headcount)" or "(disclosed in earnings call Q3 2025)" are also fine.
- **NEVER write "needs verification", "TBD", "unknown", or any TODO placeholder in this field.** If you can't get to a defensible range with a method, omit the row entirely. Empty is better than placeholder.
- **Tag the segment context** when relevant: "(mid-market wedge profile)" tells the user how the estimate was sized.

**Pain Points anti-pattern (don't):**
- Don't list constraints with semicolons as a substitute for framing the pain. "Customer ERP contracts; FedRAMP boundary; GDPR; multi-stack inference" is enumeration, not framing.
- Don't use technical jargon ("Lacks fine-grained scheduling primitives") in the buyer's field. That's the founder's framing, wrong for this row.

**Estimated Spend anti-pattern (don't):**
- "$3–8M (needs verification)" leaks the TODO directly to the dashboard. Either compute the estimate with a method, or drop the row.
- "$2.3M annual inference spend" implies confidence the public data doesn't support.

### 9.8a GTM Strategy section: exactly 5 rows

Locked field set: **Approach, Key Evidence, Urgency Level, Target Buyer, Messaging Angle**.

V1 BigPanda GTM Strategy section:
```javascript
[
  ['Approach', 'Already executed land. Focus is co-developing joint case study (cost reduction %, SLO improvement, deployment friction) for use in landing peer AIOps/observability accounts.'],
  ['Key Evidence', 'Signed design partner status. Public AI/agentic AIOps positioning at scale. Reference customer commitments under SOC 2 + ISO 27001.'],
  ['Urgency Level', 'EXECUTE, already a customer; priority is reference-account development.'],
  ['Target Buyer', 'Buyer: Platform Engineering / Site Reliability leadership. Champion: Product/Eng leaders shipping the agentic AIOps capabilities.'],
  ['Messaging Angle', 'Reliability + cost. Lead with: "Production-grade BYOC inference proven by AIOps customer cohort", establishes the category proof point.']
]
```

Patterns:
- **Urgency Level uses uppercase action verbs**: EXECUTE / HIGH / WARM / MED / COLD / DEFER. The verb is the priority.
- **Target Buyer always splits Buyer + Champion** when both are knowable. Buyer = decision-maker. Champion = internal advocate.
- **Messaging Angle includes a quoted opening line**, *Lead with: "[exact line]"*, gives the user something usable for outbound.

### 9.9 `ROW_SOURCES`, every numeric or specific claim cites

The `ROW_SOURCES` dictionary is keyed by `'CompanyName|SectionTitle|RowLabel'`. Every fact in the sections table that has a specific number, named source, or claim that could be challenged should have a corresponding ROW_SOURCES entry. V1 example:

```javascript
"Walmart|Company Profile|Industry": "Walmart 2025 10-K Filing, SEC EDGAR",
"Walmart|Company Profile|Revenue": "Walmart FY2025 Annual Report, $648B revenue",
"Walmart|Company Profile|Cloud Provider": "Walmart Global Tech blog, 'Our Hybrid Cloud Journey', Nov 2024",
"Walmart|Company Profile|AI Maturity": "Walmart Global Tech keynote, CES 2025, generative AI across supply chain",
```

The third key segment is the row's label exactly as written in `sections`, so citations follow whatever rows 4-5 this build chose (`"Acme Solar|Company Profile|Asset Type"`).

Patterns:
- **Source citation includes the publication and approximate date.** "Walmart 2025 10-K Filing, SEC EDGAR" is good. "Walmart website" is bad, too vague to verify.
- **Webset returns sources inline within text fields** (pattern: `fact text | URL / fact text | URL`, sometimes also `[source: URL]` or just bare URLs at the end). When you read a Webset enrichment value during Phase 7, scan it for URLs (regex `https?://[^\s\)]+`) BEFORE you write it into a `sections` row. Every URL extracted becomes a candidate `ROW_SOURCES` entry. After extraction, the cleaned text (without inline URLs) goes into the row value.
- **Density target: every numeric or specific claim cites.** The May 5 V2 build had `src` tags on only 2 of ~12 fields per company. V1 averages 5 of ~10. The gap is the URL extraction step above; do not skip it. If a Profile or Inference Footprint row contains a number, a named product, a regulatory standard, or any verifiable specific, it should have a `ROW_SOURCES` entry.
- **It's better to have empty ROW_SOURCES than wrong ones.** If you couldn't trace a claim's source, leave the entry blank or out, never invent a citation.

### 9.10 `CONTACT_MAP`, keyed exactly to company name

```javascript
const CONTACT_MAP = {
  'BigPanda': [
    { name: 'Jane Doe', title: 'VP Platform Engineering', linkedin: 'https://linkedin.com/in/...', primary_connection: 'Alex' }
  ],
  ...
}
```

Patterns:
- **Key string MUST match `SEGMENTS[].companies[].name` character-for-character**, including parentheses, capitalization, and any qualifiers. If the segment company is `'General Motors (Cruise)'`, the CONTACT_MAP key is `'General Motors (Cruise)'`, not `'GM'`, not `'General Motors'`.
- **`primary_connection` is the Primary teammate who has the warm intro** if any. Pull from CONTEXT.md's "Primary Network Connections" table. Empty string `''` if no warm path exists.
- **Persona discipline**: V1 contacts skewed heavily to platform/infrastructure leadership. Almost no ML eng leaders, no security/governance unless they were the platform owner, reflecting Tom's antagonist warning.

### 9.11 The "tier" decision

`tier` is `'high'`, `'med'`, or `'low'`. The visual implication: high = bold border, med = standard, low = muted/dashed. The data implication: how confident the user should be that this is a great prospect.

V1 distribution across 30 companies: roughly 10 high, 12 med, 8 low. The mix matters, if everything is `'high'`, tiers carry no information.

V1 logic:
- **`'high'`**, Either (a) signed/in-pipeline AND all 4 axes ≥4, or (b) named-pipeline with strong-signal warm intro available
- **`'med'`**, Strong ICP fit but at least one axis is moderate, or warm intro is shallow
- **`'low'`**, Speculative; pattern matches the ICP but no direct evidence + no warm path

When in doubt, err toward `'med'`. `'high'` is a promise, if a `'high'` company doesn't bear out under scrutiny, the dashboard's credibility erodes.

### 9.12 `COMPANY_SOURCES`, the source list at the bottom of each card

The `COMPANY_SOURCES` array is what renders under the "SOURCES" header at the bottom of each company card. This is where reader trust is built or lost. V1 Datadog ships **6 sources** including a **SEC EDGAR 10-K filing** and **5 named Datadog engineering blog posts** with specific technical titles ("LLMs for Postmortems", "State of AI Engineering Report", "Driving AI ROI"). The May 5 V2 Celonis ships **3 sources**: a BusinessWire press release, a TechCrunch article, and a Greenhouse job board. Same dashboard, very different credibility.

**Source count: target 6, hard floor 4.** V1 averages 6. Aim for 6 on every company. The hard floor is 4 — below that, the card looks thin and the reader doubts the rest of the data. Webset returns sources inline within enrichment text; the population step in Phase 7 must extract those URLs *and* supplement with targeted web fetches for missing high-tier sources (SEC filing for public companies, primary engineering blog for tech-forward companies). If after 2-3 supplementary fetches you can't reach 4 quality sources, the research case is thin — drop the company's tier from `high` to `med`, or swap the company out of the curated 10.

**Source quality hierarchy** (rank order — fill from the top down):

1. **Tier 1: Primary regulatory filings.** SEC EDGAR (10-K, 10-Q, S-1, DEF 14A, 8-K) for public US companies. International equivalents: SEDAR (Canada), Companies House (UK), AMF (France). For every public company in the dashboard, **at least one Tier 1 source is required**. URL pattern: `sec.gov/cgi-bin/browse-edgar` or `sec.gov/Archives/edgar/...`.

2. **Tier 2: Company engineering / research blog posts with specific technical titles.** Datadog's "LLMs for Postmortems" and "State of AI Engineering Report" are the V1 model. The bar: posts that name actual products, describe actual architecture, or report actual metrics. NOT generic landing pages or marketing copy. URL pattern: `<company>.com/blog/<specific-post-slug>` or `engineering.<company>.com/...`. For every company with a public engineering blog, aim for 2-3 Tier 2 sources.

3. **Tier 3: Earnings call transcripts.** SeekingAlpha, Motley Fool transcript pages, or company IR sites. These are gold for capturing financial pain language ("inference cost is a margin headwind"). URL pattern: `seekingalpha.com/article/...transcript`, `fool.com/earnings/call-transcripts/...`.

4. **Tier 4: Industry analyst reports.** Gartner Magic Quadrant, Forrester Wave, IDC MarketScape positioning. Gated content is fine to cite if the company was named in a public summary; cite the public summary, not the gate.

5. **Tier 5: Specific trade press reporting.** TechCrunch, The Information, Protocol, Stratechery, with named reporters and specific reporting (not press-release rewrites). Reporter byline is a quality marker — anonymous syndication is a downgrade.

**Banned (or use only if no higher-tier alternative exists):**

- **PR aggregator wires alone.** BusinessWire, PRNewswire, Reuters PR Newswire, GlobeNewswire publish corporate press releases verbatim. These are the company's own claims with extra distribution; they are not journalism. If a piece of news matters, find the trade-press follow-up that quotes a reporter, not the BusinessWire original. The May 5 V2 Celonis sourced "Celonis Earns FedRAMP — BusinessWire 2025" — better source: the FedRAMP Marketplace listing itself (fedramp.gov/marketplace/) or the Celonis customer post-FedRAMP technical blog.
- **Job board listings as standalone sources.** Greenhouse, Lever, and the company's own /careers page tell you the company is hiring; they're not independent attestations of anything else. Use them only if the source list otherwise meets the tier-1+2 minimum.
- **Crunchbase company pages.** Aggregated and often stale. Use the specific funding-round announcement instead.
- **Wikipedia.** Tertiary aggregation; use the citations Wikipedia uses.
- **Marketing landing pages.** "<company>.com/why-<product>" is the company's own positioning. Cite engineering blogs or technical docs (`<company>.com/docs/...`) instead.

**Source titling rule.** The display title in COMPANY_SOURCES should describe what's in the source, not just the source itself. V1 model:
- Good: `"Datadog Engineering — LLMs for Postmortems (Bits AI)"`
- Good: `"Datadog 10-K — SEC EDGAR"`
- Good: `"Goldman Sachs Q3 2025 Earnings Call — SeekingAlpha"`
- Bad: `"Celonis AI copilot"` (article title alone, no source attribution)
- Bad: `"Datadog Blog"` (which post? on what?)

The format is: `[Source/Outlet] — [Specific topic or filing type]`. The em dash here is a separator, not a stylistic choice (and is a permitted use within source titles, not a violation of the em-dash rule).

**Mandatory minimums per company:**
- **Target 6 sources, hard floor 4.** Below 4 is unacceptable; escalate (extra fetch, tier drop, or company swap). Between 4 and 5 is acceptable if quality tiers are present, but attempt to reach 6.
- For public companies: ≥1 Tier 1 (SEC filing or international equivalent)
- For tech-forward companies (any company with a public engineering blog): ≥2 Tier 2 (engineering posts)
- ≤1 Tier 5 (trade press) — use Tier 5 to round out a list, not as the foundation

If you can't hit the 4-source hard floor from public sources, that's a signal to deprioritize the company in tier (drop from `high` to `med`), or replace the company in the curated 10. A company that doesn't have 4 verifiable public sources is a company you don't actually have a research case on yet.

---

## 10. The "wow" signal

### What it does
Not a section in the dashboard, it's a guiding principle. The kickoff captures "what would make this founder light up?" and the build skill should *foreground that data* throughout the dashboard.

### Example
For Valar, the "wow" was: showing companies that have explicitly tried inference clouds and been blocked by security/residency. So the dashboard surfaces those quotes prominently in `RESIDENCY_MAP[].reason` and in `gtm_thesis` paragraphs.

For a different founder, the wow might be: "show me companies where the CFO has called out our problem on an earnings call." Then earnings call quotes should be plastered through `signals[]` and `opp_reason`.

### Where to surface it
- `gtm_thesis` paragraph (highest visibility)
- `signals[]` bullets (axis 3 supporting evidence)
- `opp_reason` (axis 3 tooltip)
- `overview` paragraph
- A dedicated tag if it's binary ("CFO Mentioned It," "Quoted in Press")

If the wow signal is real and well-sourced, it should be visible from any angle the user looks at the dashboard.

---

## 11. The Build Notes output

### What it is
A short markdown file (`BUILD_NOTES.md`) that documents the structural decisions you made for this project. Generated by the build skill alongside the dashboard.

### Why it matters
- Lets the user audit your decisions in one place ("oh, you renamed axis 2 to 'Compliance Burden' because of HIPAA, that's right").
- Makes future iterations easier (when the user comes back and asks "why is the dashboard structured this way?", the answer is in this file).
- Lets the user delegate the project to a teammate who didn't run the build.

### What to include
- Signal axis labels chosen + 1-sentence justification for each.
- Segments chosen + why (kept default? deviated? for what reason?).
- Sections per company + why.
- Features dropped (Network view? Hiring sub-score?) + why.
- Notable creative decisions on copy (e.g., "leaned on Tom's quote about BYOC being 'inevitable' three times across the dashboard because that's the strongest piece of voice in CONTEXT.md").

See `BUILD_NOTES_TEMPLATE.md` for the fillable shell.

---

## 12. Designing Webset enrichments for this template

The Build skill creates an Exa Webset to populate the dashboard. Each enrichment description you submit to the Webset becomes a column of data that maps to one or more data.js fields. Get this design right and population is mechanical; get it wrong and you'll have blank columns or garbage data.

### Field-by-field guidance

**Company Profile rows**, short, factual. Use `format: "text"` for most; `format: "options"` for controlled-vocabulary fields.
- "Industry classification" → free text
- "Most recent annual revenue in USD" → text (e.g., "$648B (FY2025)")
- "Headquarters city and state/country" → text
- Rows 4-5 are this build's two buyer-specific facts (see 9.8). Software example: "Primary cloud provider" → options: AWS / GCP / Azure / Multi-cloud / On-premise / Other; "AI maturity level (high/medium/low) with one-sentence supporting evidence" → text. Energy example: "Primary asset type (C&I rooftop / ground-mount solar / storage / other)" → options; "Maturity of the company's energy or demand-response program, with one sentence of evidence" → text.

**Opportunity rows**, vertical-specific. THIS IS WHERE TAILORING MATTERS MOST. Phrasing the enrichment description in the founder's domain language gets dramatically better data.
- Bad: "Use cases at this company" → returns generic "uses AI for things"
- Good (Valar): "Specific inference workloads at this company that involve heterogeneous accelerator routing or sub-50ms latency requirements" → returns concrete production AI workloads
- Good (healthcare workflow): "Documented manual prior authorization, denial management, or RCM workflow bottlenecks at this company"

**Signal scoring inputs**
- "Top 3 buying signals from earnings/blog/press in last 12 months" → maps to `signals[]`
- "Regulatory or contractual constraints affecting deployment choices" → maps to `residency_signals[]` + drives axis-2 score
- "Recent funding events, leadership changes, or strategic announcements (last 6 months)" → drives axis-3 score (Buying Trigger)

**Job postings**
- "Up to 5 active job postings relevant to [vertical] with title, key technologies, and URL" → maps to `JOB_LISTINGS[<company>]`
- The `[vertical]` part is critical. For Valar it's "inference, MLOps, or AI platform engineering." For a healthcare workflow founder it's "RCM, prior auth, healthcare engineering." Generic "AI/ML jobs" is wrong.

**Contacts**, optional via Webset; can also be done via Lovelace post-Webset.
- If using Webset: "Top 2 likely buyers/champions at this company with role and LinkedIn URL"
- The persona phrasing matters. "Buyers/champions" returns leadership; "decision makers" returns C-suite; "platform owners" returns specific functional leads. Tune to who actually buys for this founder.

**Sources**
- "5 high-quality verifiable URLs supporting the above (SEC filings, engineering blogs, press)" → maps to `COMPANY_SOURCES[<company>]`
- Specifying source types (SEC, engineering blogs, press) raises quality vs. just "URLs."

### Best practices for enrichment design

1. **Tailor every enrichment description to the founder's vertical.** Don't reuse Valar's enrichment descriptions for a healthcare or fintech founder. Re-write each one in the founder's domain language.
2. **Specify the format you want.** "Annual revenue" returns formatted strings; "annual revenue in USD as a number" returns numbers (use `format: "number"` for these).
3. **Name expected source types.** "Per the company's SEC filings or engineering blog" raises quality vs. unspecified.
4. **Limit enrichments to 8–12 per Webset.** More enrichments = longer processing time. If you have more fields you want, run a follow-up `createEnrichment` on the existing Webset rather than overloading the initial submission.
5. **Use `options` format for controlled-vocabulary fields.** Cloud provider, asset type, funding stage, maturity level, anything where you want one of N values.
6. **Avoid subjective enrichments.** "Is this company a strong fit" returns garbage. "What are the documented use cases that match the founder's product" returns specifics.

### Adapting the Valar enrichment list to a new vertical

Take Valar's enrichment list (from the build skill prompt) as a starting point. For each line item:

- Is it generic (revenue, HQ)? **Keep as-is.** Cloud and AI maturity are software-buyer fields; swap them for this founder's profile rows 4-5.
- Is it vertical-specific (use cases, pain points, current stack)? **Rewrite using the new vertical's language.**
- Is it tied to Valar's specific axes ("inference cost," "data residency")? **Rewrite to match the new axes** you chose in the signal-axis decisions.

Document your enrichment list in `BUILD_NOTES.md` so the user can audit and the Webset can be re-run later for refresh.

---

## 13. Things you can change but probably shouldn't

These are technically configurable but the defaults are tuned. Don't touch unless you have a specific reason.

- **The 0–5 axis scale.** Tested for legibility (5 dots feels right; 7 feels cluttered, 3 feels coarse).
- **The 0–100 total score formula.** (sum of 4 axes × 5). Linear and explainable. Don't introduce weights without documenting them.
- **The CSS color palette.** Tuned for the editorial-industrial aesthetic. If the founder has a brand, swap the accent variable (`--purple` family) but don't touch the structural colors.
- **The card grid layout.** Responsive breakpoints are tuned for 13" / 15" / 27" displays.

---

## 14. Things you should always change

- The product name (`{{PRODUCT_NAME}}`). **Fill this with the COMPANY name.** The
  token is badly named: it renders as the `<name> x Primary` mark, the dashboard and
  landing `<title>`, and the walkthrough masthead - all company identity. Name the
  product in prose instead.
- The signal axis labels (almost always, see Section 3).
- The opportunity section title (`{{OPPORTUNITY_SECTION_TITLE}}`).
- The hiring keyword regex.
- The tab labels (if your segment IDs differ from default).
- The placeholder companies (Acme, Beta, Gamma, Delta, Epsilon).
- The dashboard feedback-card body (`{{FEEDBACK_CARD_BODY}}`) — per-founder warmth copy at the bottom of the dashboard (the "How'd we do?" card). Explicit two-sided feedback ask, partnership tone, distinct from the walkthrough's warmth lines.
- All `[REPLACE]` and `{{PLACEHOLDER}}` strings.
- **The Webset enrichment descriptions**, generic descriptions get generic data. Tailor every one to the founder's vertical and language. See Section 12.

---

## 15. v2 dashboard defaults, the landing page, and silent-render gotchas

### v3 dashboard defaults (baked into the template — don't regress)

The dashboard (`index.html`) ships these; the build job is to not regress them (fixes go upstream to `fdi-template`, never per build):

- **Dark default + light toggle.** Dark `data-theme` tokens load by default; the `toggleTheme()` button flips to light and persists the choice to the `{{PRODUCT_SLUG}}-theme` localStorage key.
- **Green / amber score color-coding, NO red.** Tier is two-tone: `co.tier = co._signal>=75?'high':'med'`, rendered with `--q-high` (green) and `--q-med` (amber). Do not add a red tier in the tier coloring.
- **"All" tab is the default view.** `state.tab` defaults to `'all'`; the `data-tab="all"` button is `active` on load.
- **Typography — DASHBOARD:** **Space Grotesk** `--font-display` (product name + `.context-h1`), **Inter** UI/body (`--font-mono` repointed to Inter), **Newsreader** `--font-num` for prominent figures only. **NO actual monospace** — never re-add JetBrains Mono to the dashboard. The Ember mono-for-data rule below applies ONLY to `build.html` (walkthrough) + `landing.html`.
- **Ember color system:** cool ink canvas (`240`-hue near-black) + one accent ramp. Neutrals stay cool - never tint the greys with the accent hue.
- **Network + Contacts tabs:** standing, `window.NETWORK_DATA`-driven (§4) — engine-generated data, empty-state graceful, never edited per founder.
- **Balanced headers** (`text-wrap:balance` on `.context-h1`/`.context-sub`), **uniform card heights per row** (`.card-grid` stretch + `.card{height:100%}`; never `grid-auto-rows:1fr` — it inflates every row to the tallest row, so one expanded card blows up all the others), **expanded card = full-width row** (`.card-cell.is-expanded` spans `1/-1` and hides its own preview card), **17px tab bar w/ hidden count pills**, **inline-SVG partner mark** (no lockup `<img>` in dashboard topbar), **scrollable dropdowns / centered summary stats / capped trackpad zoom**.
- **Deploy:** `middleware.js` Basic-Auth gate + `vercel.json` ship with the build; the engine deploys ONLY the dashboard files (allowlist) and sets `FDI_DASHBOARD_PASSWORD`.

For the walkthrough/landing Ember typography (unchanged): **Space Grotesk display, Inter UI/body, JetBrains Mono for data only, never prose.**

### The landing page (`landing.html`) — OPTIONAL (off by default)

Since the walkthrough became the entry page (Section 16), the separate cover page is redundant — its intro job moved into the walkthrough's beat-1 opener. Build `landing.html` only on an explicit ask. Standard wiring is now:

1. Rename `index.html` (dashboard template) → `dashboard.html`
2. Copy `build.html` verbatim → the build's `index.html` + generate `build-data.js` (Section 16)

Landing-only placeholders, in addition to the dashboard set:

| Placeholder | What it is |
| --- | --- |
| `{{POSITIONING_EYEBROW}}` | One-line positioning eyebrow above the hero headline |
| `{{PRODUCT_HEADLINE}}` | Hero headline: what the founder's product does (may wrap a phrase in `<span class="accent">…</span>`) |
| `{{STAT_1_VALUE}}`..`{{STAT_4_VALUE}}` | The four hero proof-stat numbers |
| `{{STAT_1_LABEL}}`..`{{STAT_4_LABEL}}` | The four hero proof-stat captions |
| `{{PRODUCT_TRANSITION_LEAD}}` | Lead-in that pivots to the deliverable; the "Primary built {{PRODUCT_NAME}} a custom sales-intelligence dashboard" sentence stays structurally intact |
| `{{ICP_DESCRIPTION}}` | Target-account noun phrase (e.g. "multi-rooftop dealer group") |
| `{{MARKET_SIZE_PHRASE}}` | Full-universe size phrase (e.g. "18,000 cold names") |
| `{{BUYER_ROLE}}` | Named buyer role per account (e.g. "fixed-ops buyer") |

Shared with the dashboard on the landing: `{{PRODUCT_NAME}}`, `{{PRODUCT_LOGO_SVG}}`, `{{AXIS1_LABEL}}`, `{{AXIS2_LABEL}}`. The `Buying Trigger` and `Hiring` axis names are generic literals, not placeholders.

### Two silent-render gotchas (both render a blank/stuck page with no error)

1. **Apostrophe in inserted text breaks single-quoted JS strings.** The renderer builds HTML by string concatenation inside single-quoted JS. An apostrophe in a value you splice in (e.g. a company name or a description with `'`) terminates the string and the page hangs on "Loading…". After any edit to the inline `<script>`, run `node --check` on the extracted script before shipping.
2. **Unsubstituted `{{tokens}}` in executable JS position.** Fixed for
   `{{HIRING_KEYWORD_REGEX}}` on 8/17 (it is now a quoted source string with a
   fallback), but the class remains: a token outside a string literal or comment is
   a SyntaxError that kills the WHOLE inline script — the dashboard renders blank
   with only a console error. Any new per-build token in JS must sit inside quotes.
3. **`computeJobSignal()` `/careers` URL filter.** The first regex in `computeJobSignal()` strips generic `/careers` landing-page URLs so they don't count as real open reqs; keep it verbatim. The SECOND regex is the vertical keyword test, replaced by `{{HIRING_KEYWORD_REGEX}}` — set it per vertical or the Hiring axis silently scores everything as 1.

## 16. The scroll cinematic (`build.html` + `build-data.js`) — STANDARD

Every build ships TWO pages: **index.html (the scroll walkthrough) → dashboard.html.** The walkthrough IS the entry page.

### What it is

An Apple-style scroll-scrubbed walkthrough of the build. It opens with a TWO-BEAT hero: beat 1 = the founder front and center (glowing tile, wordmark × Primary, tagline, product headline from `narration.introHeadline`) with the founder's own `logoSvg` floating huge in 3D behind them (three depth-stacked copies, idle float, recedes on scroll — the per-founder wow layer); beat 2 = the dashboard pivot (punch headline, build stats, 3D preview). Then the acts: process pipeline (light beam) → ICP → signal ring-meters → market scan sweep → evidence terminal → score blend → ranked shortlist → warm-path network fan → finale CTA. Pre-baked and deterministic - no live API calls, plays identically every run. Smooth-wheel scrolling, `space` auto-plays the current act (demo-safe), `←`/`→` jump acts, `esc` exits to the dashboard, `?act=0-9` deep-links, reduced-motion renders a static article.

### The contract (the whole point)

`build.html` is **100% generic**. Copy it into the build repo VERBATIM as `index.html` - never edit its HTML/CSS/JS per founder. Everything founder-specific lives in `build-data.js` (schema: `build-data-template.js`). If you feel the urge to edit build.html for one founder, the thing you want is almost certainly a `narration` key or a schema extension - fix it in the template repo for everyone, or put it in the data.

### Generating `build-data.js`

Fill every key from the build's real artifacts (mapping is commented per-key in `build-data-template.js`). Every narration key is **required for a newly generated build**; the small set of guarded optional fields (`introWarmth`, `finaleWarmth`, `scan.methodNote`) are **optional at runtime** — the template hides them cleanly when absent so older builds don't break, but a new build must fill them. Rules:

- **Copy voice:** confident analyst briefing the founder. Hyphens only, never em dashes. Hero frames account **quality**, not count ("18,000 rooftops in. The readiest buyers out."). Narrations ≤2 sentences. Keep the honest hedges ("illustrative warm-path layer", "where we have one").
- **Numbers and citations are real.** `evidenceFeed` lines come from the scored companies' own sources; hero stats are the build's actual counts. Never fabricate.
- **Exactly one axis carries `wowNote`** - the founder-specific WOW signal. Its body is the "why this signal wins" reasoning from CONTEXT.md, in 3-4 sentences.
- **Network stays role-based illustrative** (`illustrative: true`) unless real Affinity/LinkedIn connector data is supplied. Each account belongs to exactly one connector (partition); secondary paths go in `alsoReaches`.
- **Theme:** the accent color is chosen in the hub build form (a preset dropdown) and rides through `config.theme_color`. `theme-presets.json` (repo root) is the single source of truth for all 12 presets — `ember`(default) `gold` `coral` `rose` `magenta` `violet` `indigo` `blue` `cyan` `teal` `emerald` `lime`. The skill (Phase 8/8c) reads it and stamps BOTH artifacts: the walkthrough via `founder.themeAccent` (the preset's 6 `walkthrough` triples — applied at runtime by build.html:~884), and the dashboard via the `{{THEME_ACCENT_DARK}}`/`{{THEME_ACCENT_LIGHT}}` placeholders (the preset's `dashDark`/`dashLight` base colors expanded to the `--green*` ramp; `--q-med`/`--q-med-d` follow `--green` automatically). Unknown/absent key → `ember`. **Only the accent recolors** — `--purple`/`--teal`/`--q-high`(green)/`--q-low`(red) are fixed on purpose (tier legend + info hierarchy). To add/edit a preset, change `theme-presets.json` only, then add the key to the hub dropdown; all light-mode accents must clear ≥4.5:1 as text on white. Hand-setting `founder.themeAccent` in build-data.js still overrides the preset.
- **Apostrophe gotcha applies:** curly `’` inside JS strings, then `node --check build-data.js`.
- **Warmth lines (partnership tone):** `narration.introWarmth` (one sentence under the intro headline) and `narration.finaleWarmth` (one sentence between the finale CTA and replay, `<b>` on the close) are confident-partnership lines — never self-deprecating (no "we gave it our best shot"). Both render via `innerHTML` (trusted HTML: `<b>`/accent spans allowed) and are **guarded** — an absent key hides the element cleanly, so old builds that lack them don't break. The three warmth strings (these two + the dashboard's `{{FEEDBACK_CARD_BODY}}`) play **distinct rhetorical roles and must not repeat each other**: intro = "our deep dive into your world, excited to keep exploring together"; finale = "the start of a conversation, looking forward to continuing the research together"; dashboard card = the explicit two-sided feedback ask, closing on making it stronger together.
- **TAM discipline:** `scan.universe` is the NARROW-ICP estimate that matches the scan query (the population that would pass all ICP criteria), **not** the broad market TAM. Funnel universe label = "est. in [Founder]'s ICP". `heroStats` = 5 stats leading with the ICP-TAM estimate; `finaleSub` restates the same number in prose. `scan.methodNote` (optional; replaces the generic scan-note when present) tells the full funnel story in plain language, **≤~40 words** (line count is viewport-dependent, so budget words not lines): TAM est. → surfaced & analyzed → strongest fits → curated to final N. Ground the TAM in a real bottom-up method, named in BUILD_NOTES.
- **Tagline anti-duplication:** `founder.tagline` renders directly above `introHeadline`. If it would restate the headline, set it to `""` — beat 1 renders cleanly without it.
- **Score parity on ties:** if Phase 7 broke composite ties with `composite` overrides in data.js, `companies[].score` here carries the identical numbers (see §3 "Breaking score ties"). Walkthrough shortlist and dashboard must agree. (Manual check — `universe` is a number and `finaleSub` is prose, so there's no automated equality gate; eyeball that they state the same figure.)

#### A sample, never a census (Jason, 2026-08-17)

The single most important framing rule, and the one the Forgepoint founder review
kept correcting. What ships is a **first-pass sample of the strongest ICP fits our
process surfaced**, put in front of the founder to get their feedback and sharpen
the filtering and the signals. It is not the market, not a finished target list,
and not "the N companies out there."

- **Banned in rendered copy:** "most ready to buy", "the readiest buyers", "the
  [N] accounts to target", "we scan the entire market", "the accounts worth
  walking into", "the highest-quality accounts in the market", and any
  market-wide superlative. `scripts/smoke-test.mjs` sweeps rendered text for
  these and fails.
- **Scope rankings to the sample:** "relative signal strength within this sample",
  never "readiest in the market".
- **Counts are process artifacts.** The scan beat keeps its big number, but
  labelled as what the process found, not as the size of the opportunity. A
  figure that came from the founder is attributed ("your own sizing").
- **[X] profiled and [Y] curated are different numbers** and must never be
  conflated. A "[Y] profiled" slip shipped once.
- **The locked beats.** `introHeadline`, `introWarmth` and `heroTitle` have
  approved company-agnostic defaults inside build.html. Leave them empty in
  build-data.js. The intro beat sells Primary's PROCESS and carries **no account
  counts or sample sizes at all** — Alex cut them explicitly ("it's about the
  process, not the outcomes; we're selling Primary and our services, not this
  actual build"). The subheader stops hard at "…Primary's network."

#### Display score band: 70-100

Raw composites read like school grades — the best account in a strong sample
looks like a B-minus and the floor looks like a failure, when every account shown
already cleared the bar. Both pages rescale **at runtime**, from the same
formula, so they cannot drift:

```
display = round(70 + (raw - lo) * 30 / (hi - lo))      // all tied -> 100
```

`lo`/`hi` are this build's own min and max. The dashboard runs it after tiering,
so the high/med split still derives from the RAW score; raw is preserved on
`_signalRaw` (dashboard) and `_scoreRaw` (walkthrough). The map is monotonic, so
every sort and ranking is unaffected.

**Write RAW scores only.** Never hand-write `composite`, a display score, or a
pre-scaled number — it gets scaled twice and silently drifts the two surfaces
apart, which is the bug this replaced.

#### Act 08 is opt-out

`network: { show: false }` in build-data.js removes act 08 (the illustrative
warm-path fan) entirely: scene, rail entry and render hook. Default is ON. Use
the flag rather than commenting the markup out — both 8/17 builds cut the act by
hand and left ~25 lines of defused HTML behind. This is unrelated to the
DASHBOARD's Network tab, which renders real Affinity data and has its own empty
state.

### Assets

- `assets/logos/` (tool logos for the process act) copies from the template as-is.
- `assets/primary-lockup.svg` is **mandatory** — both the walkthrough intro lockup and the dashboard topbar reference `./assets/primary-lockup.svg`. Copy the WHOLE `template/assets/` tree (never cherry-pick `logos/`); a missing file 404s the lockup on both pages. Verify it returns HTTP 200 (or exists on disk) before shipping.
- `assets/dashboard-preview.png` is a screenshot of THIS build's finished dashboard, used by the hero's 3D preview. Capture it after the dashboard is populated (1600×1000, 2x). If it's missing the hero degrades gracefully (preview hides) - ship it anyway; the hero is much weaker without it.

### Self-check before shipping

0. `npm run smoke` in the template repo passes (headless render of both pages:
   zero page errors, one card per company, previews expand in-column and by row,
   70-100 band with tiers off raw, hero on one line per line, no banned copy).
1. `node --check build-data.js` passes.
2. Every `narration` key filled EXCEPT the three locked beats (`introHeadline`,
   `introWarmth`, `heroTitle`), which stay empty so build.html's approved copy
   renders.
3. `grep -i` the previous founder's name in build-data.js → 0 hits.
4. Open `build.html?act=N` for N=0..9 - every scene renders with this build's data.
5. Weights in `axes[]` sum to 100; `companies[0]` is the intended hero account (act 6 uses it).
6. Warmth lines render under the headline / between finale CTA and replay when present, and disappear cleanly (no gap) when the keys are removed; `scan.methodNote` replaces the generic scan-note line.
7. `heroStats` has exactly 5 entries leading with the TAM stat; `scan.universe` (narrow-ICP estimate) and `finaleSub` state the same figure; `founder.tagline` does not restate `introHeadline`.


## Shared writing guide

Read [COPYWRITING_GUIDE.md in fdi-draft-skill](https://github.com/Primary-OS/fdi-draft-skill/blob/main/COPYWRITING_GUIDE.md) before authoring copy. It is the shared editorial policy for the entire build, including Talent and the in-site editor. Preserve approved Welcome, intro, and hero copy and established product names. Read headings together in page order, then supporting text; change only wording with a specific problem. Existing schema, citation, factual, and render checks still apply. Older sample sentences here illustrate field structure, not mandatory prose to imitate.
