# African CMIP6 Ensembling — wiki draft for the CGIAR Climate Data Hub

This directory holds the source draft for a partner-facing reference page on how the Adaptation Atlas selects CMIP6 climate-model ensembles for African regions. The intended host is the **CGIAR Climate Data Hub**; the page is authored in Astro-compatible Markdown so the CDH team can drop it into their static site with minimal adaptation.

## Files

- `index.md` — the main page content. Frontmatter at the top; pure CommonMark body so it works in Astro / MDX / standard markdown viewers alike.
- `figures/` — placeholder for the six core figures referenced in `index.md`. To be commissioned per the research plan.

## Source / planning

Research plan: `../../handovers/climateRationale/dispatches/2026-05-28_cmip6-wiki-research-plan.md`
Methodology dispatch: `../../handovers/climateRationale/dispatches/2026-05-28_african-cmip6-sub-ensembles-research.md`

## Hand-off notes for the CDH team

1. The page is written for an educated climate-rationale writer, not a climate modeller. Plain language, glossary inline, callouts for key takeaways.
2. Astro-friendly Markdown: standard front-matter + GFM body. Use as `.md` or convert to `.mdx` if you want richer component embeds for the callouts and figure captions.
3. Six core figures are referenced as placeholders. Sources / sketches noted inline. CDH may commission directly or pull from the cited papers (with permission).
4. National / regional perspectives section (§9) ships as placeholder content with a "contribute" affordance — open-contribution model after initial publish.
5. EN draft is final-ready; FR translation follows once EN copy locks.
6. Versioning: bump `version` in the frontmatter on each significant content change; the wiki commits to retaining old versions for citation stability.

For questions: ping Pete (`p.steward@cgiar.org`).
