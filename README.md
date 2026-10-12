# fdi-template

A reusable template for Primary's FDI (Founder-Driven Intelligence) motion. Activates as the structural starting point for every new FDI dashboard project.

## What this is

The FDI motion has three steps:

1. **Research** — Capture the founder's vertical, ICP, signals, and voice (handled by the `kickoff-fdi` skill).
2. **Enrichment** — Find and enrich relevant company data (handled by Claude calling Exa).
3. **Build** — Combine research + enriched data + this template into an interactive HTML dashboard (handled by the `fdi-build` skill).

This repo is the starting point for step 3. It contains:

- A working template HTML dashboard with placeholder data that renders (open `index.html` in a browser to see).
- A schema-commented `data.js` that documents what data Claude needs to fill in.
- Two markdown guide docs that tell Claude (and you) how to use the template.
- Fillable shells for the two outputs: `CONTEXT.md` and `CLAUDE_DESIGN_PLAN.md`.

## The two standard pages (every build)

```
index.html  ──────────────────────▶  dashboard.html
 (the scroll walkthrough:               (the product)
  two-beat founder opener,
  then the acts)
```

Both use the cool-ink canvas + single accent ramp. **Typography differs by page:** the **walkthrough** (`build.html`) + `landing.html` use the Ember system (Space Grotesk display / Inter body / **JetBrains Mono** for data); the **dashboard** uses Space Grotesk display + Inter body + **Newsreader** serif for prominent figures and **NO monospace** (Lyric match, 2026-07-16). The walkthrough opens on the founder (their own mark floating huge in 3D behind the intro), pivots to the dashboard punch, then scrolls through the acts — deterministic, `space` auto-plays acts, driven entirely by `build-data.js`. See TEMPLATE_GUIDE Section 16. `landing.html` remains as an OPTIONAL extra cover page (off by default).

The dashboard carries two data-driven relationship tabs — **Network** (radial warm-path map per account) and **Contacts** (filterable worklist) — driven solely by `window.NETWORK_DATA` from `network-data.js`, which the **FDI engine generates from Affinity after the build** (not the skill). They show designed empty states until that file exists.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The dashboard template (renamed to `dashboard.html` in a build). CSS + JS intact from Valar; brand strings + signal labels are placeholders. |
| `landing.html` | OPTIONAL extra cover page (off by default since the walkthrough became the entry). |
| `build.html` | The scroll walkthrough — ships as the build's `index.html`. 100% generic; copied verbatim, driven only by `build-data.js`. |
| `build-data-template.js` | Schema-commented shell for `build-data.js` (the cinematic's only founder-specific input). |
| `assets/logos/` | Tool logos used by the cinematic's process act. Copied as-is. |
| `data.js` | Schema-commented data layer for the dashboard. Placeholder companies demonstrate shape. `PRIMARY_TEAM` is fictional + unused by the UI. |
| `network-data.js` | FICTIONAL dev fixture for the Network/Contacts tabs. The **engine overwrites it per-build** with real Affinity data. Skill never touches it. |
| `middleware.js` | Edge Basic-Auth gate (fail-closed) so deployed dashboards aren't public; engine sets `FDI_DASHBOARD_PASSWORD`. |
| `vercel.json` | `{"framework": null}` static serving. |
| `AI_INSTRUCTIONS.md` | **Read first.** Pointers to the canonical SKILL.md + file inventory. |
| `TEMPLATE_GUIDE.md` | Reference encyclopedia. For each structural element: what it does, when to use, when to skip. Section 16 = the cinematic. |
| `CONTEXT_TEMPLATE.md` | Fillable shell for the founder research dump. Output of `kickoff-fdi`, input to build. |
| `CLAUDE_DESIGN_PLAN_TEMPLATE.md` | Fillable shell documenting the structural choices the build skill made for this project. |
| `README.md` | This file. |

## Reference example

The gold standard finished project is `github.com/alexg207/valar-fdi` (private — request access). When in doubt about tone, density, or how a populated dashboard should feel, study Valar.

## Usage

### From Claude (the build skill)
Claude reads `AI_INSTRUCTIONS.md` first, then this repo's other files, then produces a customized version of `index.html`, `data.js`, `CONTEXT.md`, and `CLAUDE_DESIGN_PLAN.md` for the specific founder.

### From a human
1. Run the `kickoff-fdi` skill to produce a `CONTEXT.md` for your founder.
2. Run the `fdi-build` skill, pointing at this template repo + the kickoff output.
3. Review the generated dashboard. Iterate on copy/structure as needed.
4. Deploy to Vercel (or wherever) and share with the founder.

## Local preview

```bash
git clone https://github.com/Primary-OS/fdi-template.git
cd fdi-template
python3 -m http.server 8080
# open http://localhost:8080
```

The placeholder data renders. You'll see "{{PRODUCT_NAME}}" and "Acme Corp" everywhere — that's expected. The build skill replaces these.

## Maintenance

This template should evolve with the FDI motion:

- **After each new FDI project**, ask: did this project's good parts diverge from the template? If yes, was the divergence vertical-specific (leave it) or generally better (fold it back in)?
- **Don't make the template perfect on day one.** It's meant to grow from real project usage.
- **Rev the version when the schema changes** (touching `data.js` field names breaks all downstream projects). For copy/structural updates, just commit.

## Contributors

- **Alex Giles** — Template owner, primary maintainer.
- **Charles Holley** — Original Valar dashboard architect (the reference example).
- **Logan** — Primary GitLab/CI infrastructure.
