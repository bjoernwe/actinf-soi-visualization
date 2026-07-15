# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An interactive explainer that reframes the classical meditation "progress of insight" stages (Baseline → Access → A&P → Dissolution → Dark Night → Equanimity → …) as **hierarchical predictive inference**. A Vite + TypeScript + Lit build, multi-page (each page is its own static HTML entry sharing one component library), no runtime dependencies except Lit and Google Fonts. The walkthrough is the main page; `component-demo.html` is a scaffold page proving the diagram is reusable with a different layer count, not authored model content.

- `index.html` / `component-demo.html` — one `<script type="module">` each, into `src/pages/`. Add a page by adding both an HTML entry and a line in `vite.config.ts`'s `build.rollupOptions.input`.
- `src/insight-inference.css` — all styling, shared by every page; the design-system tokens live in `:root`.
- `src/model.ts` — the intensity system: `Level`, `IntensityValues`, the `INTENSITY` table, `MAX_BREADTH`, the pred/err `COLORS`.
- `src/diagram.ts` — `Layer`, `DiagramConfig`, `gapIds()`: what makes a diagram's layer constellation data instead of hardcoded.
- `src/stages.ts` — the authoring **types** (`Stage`, `Comment`, `Flow`, …) and `validateStage()`. No content lives here anymore.
- `src/content/insight-inference.ts`, `src/content/demo.ts` — the actual authored `DiagramConfig` + `Stage[]` per page. Edit stage content here.
- `src/engine.ts` — `FlowEngine`: the canvas particle stream + tween, generalized over a `DiagramConfig`'s gap count.
- `src/comments.ts` — `CommentLayer`: comment placement math, owned by `FlowEngine`.
- `src/components/` — Lit components in light DOM (`createRenderRoot() { return this; }`, so the global CSS applies unchanged): `<stage-rail>`, `<flow-diagram>` (hosts a `FlowEngine`), `<tier-layer>`, `<comment-note>`.
- `src/page.ts` — `mountPage(config, stages)`: wires a page's rail/diagram to its content and hash routing. A page's bootstrap (`src/pages/*.ts`) is just this call.

## Running

`npm install`, then `npm run dev` for a Vite dev server with HMR (serves every page under `src/pages/` by its `.html` path, e.g. `/component-demo.html`), or `npm run build` (runs `tsc` first, then `vite build`) for a static `dist/` with every page listed in `vite.config.ts` bundled. There is no lint or test step. `file://` no longer works directly — it needs the dev server or a built `dist/`.

## Audience & tone (this shapes all copy)

Readers are **dual-literate**: they know MCTB / Dharma Overground stage vocabulary (A&P, dark night, equanimity, cessation) *and* the basics of predictive processing / active inference (prior, prediction error, precision, model update). Do not explain those primitives — use them. Register is precise, unhurried, pragmatic-dharma: mechanistic and falsifiable-where-possible, never breathless or mystical. Existing stage copy is the style reference.

## The model being visualized

Two coordinates only — **S (solidity)** = precision of object-layer priors, and **O (opacity)** = how much experience is seen *as construction*. A third coordinate, **Realness (R), was tried and deliberately dropped — do not reintroduce it.** O has two regimes that carry most of the story: *effortful* opacity (fragile, policy-driven, fails under load — through Dissolution/Dark Night) vs *learned* opacity (a trained-in structural prior, effortless — Equanimity).

Visual grammar, load-bearing and non-negotiable: **predictions flow DOWN (periwinkle `--pred`), prediction errors flow UP (ember `--err`)**. "Blue falls, orange rises." Do not repurpose these two colors. Low S is *progress* in this model, not failure — never render dissolution as "bad."

Deep background on the per-stage claims (what each stage asserts in S/O terms, why the *transitions* are where the model lives) is in `doc/HANDOFF-for-visualization.md` and `doc/HANDOFF-stages.md`. Read them before writing or changing stage copy. **Caveat:** those docs predate the current engine and describe an older `p`-param scheme (`g0p/g0e`, `inR`, …); the code below is the source of truth for mechanics.

## Code architecture

**A page is a `DiagramConfig` + a `Stage[]`, wired by `mountPage()`.** `DiagramConfig` (`diagram.ts`) is just `{ layers: Layer[] }` — an ordered list of `{ id, title, sub }`. Gap ids are positional: `g0` sits between `layers[0]`/`layers[1]`, etc. (`gapIds()`). A page's content module (`src/content/*.ts`) pairs one `DiagramConfig` with a `Stage[]` authored against it; its bootstrap (`src/pages/*.ts`) is one line: `mountPage(THE_DIAGRAM, STAGES)`.

**`Stage` (types in `stages.ts`) is the spine.** The rail is generated from a page's `Stage[]` and `mountPage()`'s internal `setStage(i)` swaps the active target. Each stage entry has:
- `streams` — for each of the diagram's gaps, a `down` and `up` intensity **level name** (`Level = 'low' | 'med' | 'high'`).
- `intake` — the region below the last layer: `in` (sensory inflow, up/error) and `out` (outward action, down/prediction), each a level name.
- `jit` (lateral churn) and `spd` (flow-speed multiplier).
- `comments: Comment[]` — a discriminated union, `GapComment | TierComment` (narrow with `'tier' in def`), so a gap-anchored vs tier-anchored annotation can't mix fields.

`Gap`/`Tier` are plain `string`, not literal unions — a diagram's actual gaps/tiers come from its `DiagramConfig` at runtime, not one fixed compile-time shape (there are two `DiagramConfig`s already, with different layer counts). `validateStage()` recovers that safety at dev time: it checks a stage's gap/tier references against its `DiagramConfig` and throws a stage-named error on a typo, instead of a silently dead stream or an unplaced comment. `mountPage()` calls it under `import.meta.env.DEV` automatically — a page's bootstrap doesn't need to.

**Intensity is indirected through `INTENSITY` (in `model.ts`).** Level names resolve to four tweenable channels — `breadth` (band width, the primary cue), `rate` (bubbles/sec), `alpha`, `size` — so a level reads even in a still frame or grayscale. `FlowEngine.resolveStage()` flattens a stage's level names into numbers; its `frame()` tweens `live` → `target` via exponential approach, so **transitions are themselves meaningful** and must be tuned per stage, not just the endpoints.

**`FlowEngine` (`engine.ts`) owns one diagram's canvas + comment layer.** Constructed by `<flow-diagram>` (`components/flow-diagram.ts`) against its own canvas/tier/comment DOM; `setStage()` retargets the tween and re-renders comments in one call, `resize()` relays to the comment layer. Its geometry (`geom()`) reads `getBoundingClientRect` on the tier elements every frame, so tier positions/sizes are driven by CSS, not hardcoded in JS. The tiers live in a normal-flow `.tier-stack` (flex column); `.diagram` has no fixed height and sizes to whatever that stack measures, so resizing a tier reflows the gaps and the intake region below it instead of breaking the layout (previously tiers were `position: absolute` at hardcoded pixel `top`s inside a fixed-height diagram — do not go back to that). The stack's vertical rhythm — `--tier-gap`, `--tier-width`, `--stack-pad-top`/`-bottom` — lives in `:root` custom properties in `insight-inference.css`; the mobile breakpoint only overrides `--tier-width`. Canvas is DPR-aware; particles are pooled.

**Comment layer** (`comments.ts`'s `CommentLayer`, owned by `FlowEngine`) is separate from the canvas. `render()` rebuilds `<comment-note>` elements on each stage change (so count/text/placement can differ per stage) — it applies the `comment`/`comment dock` class itself, synchronously at creation, because the dock-sizing pass below needs it present before Lit's own (async) first render of that element lands. `place()` pins each box beside its anchor `{ gap, side }` using live geometry, clearing the widest a high-intensity band can reach so streams never overlap text; the accent edge always faces *inward* toward the stream (`pin-left`/`pin-right`). `layout()` re-runs on resize, and once more after each `<comment-note>`'s own `updateComplete` resolves, since a dock's height comes from its actual (icon + body) content, which Lit hasn't painted yet on the first pass.

**Lit components are light-DOM** (`createRenderRoot() { return this; }`) so the global `:root` tokens and `insight-inference.css` apply directly — no shadow-DOM style duplication. `<tier-layer>`'s `.tier` class and id are applied by `<flow-diagram>`'s own template, not inside `tier-layer` itself, for the same synchronous-vs-async reason as comments: geometry needs to be correct the instant the parent's render commits.

## Working conventions

- **This build proceeds incrementally — extend the existing pattern, don't rewrite.** The page was deliberately stripped to a foundation; elements (precision indicator / π-meter, right-hand content panel, S/O gauges, cessation blink) return one stage/feature at a time. Do not re-add them wholesale.
- **Change one thing at a time; respect the module boundaries (types in `stages.ts`/`diagram.ts`, content in `content/`, engine in `engine.ts`/`comments.ts`, shell in `components/`, per-page wiring in `pages/`); keep diffs small.** Commit at each step.
- A new page is a `DiagramConfig` + `Stage[]` in `content/`, a one-line bootstrap in `pages/` (`mountPage(config, stages)`), an `.html` entry, and a line in `vite.config.ts`'s `build.rollupOptions.input`. It should not need changes to `engine.ts`, `comments.ts`, or `components/`.
- Reuse the `:root` CSS variables — don't hardcode colors. `--gold` (precision) and `--calm` (learned-opacity accent) are currently unused, reserved for when those elements return.
- `prefers-reduced-motion` needs a static fallback when the engine grows (earlier builds rendered static line-thickness instead of streaming dots) — re-add it rather than leaving reduced-motion readers with a dead diagram.
- When a change touches the *model's claims* (not just styling), surface the interpretive choice to Björn rather than silently picking one. Two open modeling items are flagged in the handoff docs: how A&P reads in pure S/O now that R is gone, and the precision-encoding scheme (error-gain vs prior-confidence).
