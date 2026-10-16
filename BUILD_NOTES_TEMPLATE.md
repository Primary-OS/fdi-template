# {{FOUNDER_NAME}} FDI — Build Notes

**Build run:** [DATE] via `/generate-fdi-draft` skill (Claude Code)
**Repo:** [GitHub URL — set in Phase 0]
**Webset ID:** [ID from Phase 6g — used for refresh runs]

This document captures the structural choices and quality posture of the build. Read this before delivering the dashboard so you know which decisions to defend and which gaps to flag.

---

## 1. Signal axes (Phase 5)

Document the 4 (or 5-6) axes chosen, with one-paragraph justification each.

**Mandatory axes:**
- **Hiring Score** — [what it measures, what data it pulls from in this vertical]
- **Opportunity Score** — [what it measures, what data sources]

**Founder-specific axes:**
- **[Axis 3 name]** — [why this axis was chosen for this founder; what it discriminates; how it ties to CONTEXT.md ICP Qualifier and lookalike anchors]
- **[Axis 4 name — typically the wow-signal axis]** — [why this is the wow axis; what cited evidence shape signals score 5; per Phase 5 rubric]

If the build deviated from the standard 4-axis structure (5+ axes, or fewer than 4), document why.

## 2. Segments + reasoning

Default: Pipeline / Mid-Market / Enterprise. If you deviated:
- [Segment label] — [N companies] — [reasoning: why this segmentation matches the founder's GTM motion better than size-based]

If the founder has only one ICP, document why you collapsed to one segment.

## 3. Sections per company

Default: Profile (5 rows) / `[SECTION_2_LABEL]` (4 rows) / GTM Strategy (5 rows).

- `[SECTION_2_LABEL]`: [chosen label — e.g., "Inference Footprint", "Workflow Footprint", "Capex Footprint", "Compliance Footprint", "Trial Footprint"]
- Justification: [why this label fits the founder's vertical and reads naturally to the buyer]
- Profile rows 4-5: [the two buyer-specific facts, e.g., "Cloud Provider, AI Maturity" (software) or "Asset Type, Energy-Program Maturity" (energy)] — [why these matter to this founder's buyers]

If you renamed any section or added a 4th section (e.g., "Competitive Landscape", "Decision Unit"), document why.

## 4. Features kept / dropped

- Network view: [kept / dropped] — [why]
- Hiring sub-score: [kept / dropped] — [why]
- Tier filter: [kept / dropped] — [usually kept]

If you dropped a feature, what does the dashboard lose? If you added one, what does it gain?

## 5. Notable copy decisions

Document anything non-obvious about the dashboard's copy:
- Verbatim founder quotes spliced into gtm_thesis paragraphs (which ones, which companies)
- Antagonist personas explicitly excluded (per CONTEXT.md and Phase 7 antagonist consistency check)
- The wow signal — where it appears (gtm_thesis / signals[] / tags / overview) and which companies showcase it most concretely
- Any sourcing trade-offs (e.g., "Caterpillar's Tier-2 sources lean heavily on trade press because they don't publish engineering blogs")

## 6. Companies featured + rationale

For each company in the curated final list, one line on why it's in:
- [Company A] — [rationale: signed design partner / named pipeline / founder-named ICP pick / strong Webset signal]
- ...

If Webset returned more candidates than you used, document the **cut list** so the founder sees what didn't make it and why:
- [Company X] — dropped because [vendor false-positive / sparse enrichments / wrong-region / weaker public signal]
- ...

If you shipped 9 instead of 10 (per Output Style Rule #6), name the dropped slot and why.

## 7. Webset details (for refresh / reproducibility)

- **Webset ID:** [from Phase 6g]
- **Dashboard URL:** https://websets.exa.ai/websets/[id]
- **searchQuery (full text):** [paste the buyer-profile paragraph]
- **searchCriteria (5 filters with source-type tags):**
  1. [criterion 1] `[tag]`
  2. [criterion 2] `[tag]`
  3. ...
- **searchCount:** 15 (oversample to fill 10-company target)
- **Enrichment columns:** [list of Webset enrichment titles]
- **Iteration history:** [if you re-fired with adjusted criteria, document the iteration count and what changed]
- **Completion time:** [Webset start → idle elapsed]

## 8. Reproducibility

The build's input/output state lives in this repo:
- `webset-spec.json` — the spec submitted to Webset (Phase 6g)
- `webset-response.json` — full Webset return with all enrichments (Phase 6h)
- `sumble-jobs.json` — Sumble + fallback ladder job data (Phase 6j)
- `lovelace-contacts.json` — LinkedIn contacts (Phase 6k)
- `founder-pick-research.json` — directed research for founder-named picks (Phase 6m)
- `config.json` — Phase 0 build configuration (founder name, slug, geo scope)
- `inputs/` — raw founder docs (read-only reference)

To refresh data later:
1. `cd ~/fdi/<slug>` and `git pull`
2. Re-run the skill (it will detect Path A and skip Phase 0 setup)
3. Phase 7 reads from saved JSON intermediates; Phase 6m re-runs Exa searches

To rerun Phase 7 only without re-firing the Webset:
1. Edit `webset-response.json` if needed (manual fixes)
2. Re-spawn the Phase 7 subagent with the same prompt

## 9. Data quality notes + open questions

**Strong signals (high-confidence entries):**
- [Companies + which axes hit 5 with cited evidence in the wow shape]

**Thin signals (flagged for human follow-up):**
- [Companies with sources at the 4-floor; what's missing; what would make them ship-worthy]
- [Companies where founder-pick research returned thin sourcing despite directed Exa queries]

**Score distribution:**
- Tier breakdown: [N high / N med / N low]
- Founder-specific axis-1 (e.g., "[Axis 3 name]") score range: [min-max]
- Founder-specific axis-2 (wow axis) score range: [min-max] — should NOT be all 4-5; if so, regression to F3 score inflation

**Open questions for the founder (review before delivery):**
- [Question 1: anything you want them to confirm before showing externally]
- [Question 2: anything Phase 7 marked "needs verification" that needs them to fill]

**Recommended next steps before the demo:**
1. Pick the 5 companies to lead with (from the 9-10 in the dashboard)
2. Review the [N] flagged data points in section 9 above
3. [Vertical-specific actions: e.g., for industrials founders, validate the wow-evidence shape against actual operational data]
4. Spot-check 3 random gtm_thesis paragraphs against Output Style Rule #14 ("Reference build is scaffolding") — if the output reads as inference-vertical for a non-inference founder, regression
5. Push to the GitHub remote (`git push`) and connect to Vercel for hosted preview if needed

## Cinematic (build.html + build-data.js)

- **build.html copied verbatim from template:** [yes — required; never edit per founder]
- **narration voice decisions:** [hero title line 2 framing, what the wow-note argues, any deviations from default narration patterns]
- **evidenceFeed sources:** [which companies' citations were used; tier mix]
- **wowNote axis:** [which axis carries it and why]
- **themeAccent:** [omitted (Ember default) / overridden to X because Y]
- **dashboard-preview.png:** [captured at NxN after dashboard populated / pending]
- **self-check:** [node --check pass; previous-founder-name grep = 0; ?act=0-9 verified]
