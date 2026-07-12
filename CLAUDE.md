# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page interactive explainer that reframes the classical meditation "progress of insight" stages (Baseline → Access → A&P → Dissolution → Dark Night → Equanimity → …) as **hierarchical predictive inference**. Three files, no build step, no dependencies except Google Fonts:

- `insight-inference.html` — structure: header, stage rail, and the diagram (four tiers + a canvas).
- `insight-inference.css` — all styling; the design-system tokens live in `:root`.
- `insight-inference.js` — one IIFE: the stage model, the canvas particle engine, and the comment-layout system.

## Running

Open `insight-inference.html` directly in a browser. There is no build, lint, test, or dev-server step. Any static file server works if you need one (`python3 -m http.server`), but the file is fully self-contained.

## Audience & tone (this shapes all copy)

Readers are **dual-literate**: they know MCTB / Dharma Overground stage vocabulary (A&P, dark night, equanimity, cessation) *and* the basics of predictive processing / active inference (prior, prediction error, precision, model update). Do not explain those primitives — use them. Register is precise, unhurried, pragmatic-dharma: mechanistic and falsifiable-where-possible, never breathless or mystical. Existing stage copy is the style reference.

## The model being visualized

Two coordinates only — **S (solidity)** = precision of object-layer priors, and **O (opacity)** = how much experience is seen *as construction*. A third coordinate, **Realness (R), was tried and deliberately dropped — do not reintroduce it.** O has two regimes that carry most of the story: *effortful* opacity (fragile, policy-driven, fails under load — through Dissolution/Dark Night) vs *learned* opacity (a trained-in structural prior, effortless — Equanimity).

Visual grammar, load-bearing and non-negotiable: **predictions flow DOWN (periwinkle `--pred`), prediction errors flow UP (ember `--err`)**. "Blue falls, orange rises." Do not repurpose these two colors. Low S is *progress* in this model, not failure — never render dissolution as "bad."

Deep background on the per-stage claims (what each stage asserts in S/O terms, why the *transitions* are where the model lives) is in `doc/HANDOFF-for-visualization.md` and `doc/HANDOFF-stages.md`. Read them before writing or changing stage copy. **Caveat:** those docs predate the current engine and describe an older `p`-param scheme (`g0p/g0e`, `inR`, …); the code below is the source of truth for mechanics.

## Code architecture (`insight-inference.js`)

**`STAGES` is the spine.** An array of stage configs; the rail is generated from it and `setStage(i)` swaps the active target. Each stage entry has:
- `streams` — for each of three gaps `g0/g1/g2` (between the four tiers), a `down` and `up` intensity **level name** (`'low' | 'med' | 'high'`).
- `intake` — the region below the sensory tier: `in` (sensory inflow, up/error) and `out` (outward action, down/prediction), each a level name.
- `jit` (lateral churn) and `spd` (flow-speed multiplier).
- `comments` — per-stage annotation boxes (see below).

**Intensity is indirected through `INTENSITY`.** Level names resolve to four tweenable channels — `breadth` (band width, the primary cue), `rate` (bubbles/sec), `alpha`, `size` — so a level reads even in a still frame or grayscale. `resolveStage()` flattens a stage's level names into numbers; `frame()` tweens `live` → `target` via exponential approach, so **transitions are themselves meaningful** and must be tuned per stage, not just the endpoints.

**Geometry is read from the DOM every frame.** `geom()` calls `getBoundingClientRect` on the tier elements, so tier positions/sizes are driven by CSS (`#tier-*` `top` values), not hardcoded in JS. Move a tier in CSS and the streams follow. Canvas is DPR-aware (`resize()`); particles are pooled in `parts[]`.

**Comment layer** is separate from the canvas. `renderComments()` rebuilds the boxes on each stage change (so count/text/placement can differ per stage); `placeComment()` pins each box beside its anchor `{ gap, side }` using live geometry, clearing the widest a high-intensity band can reach so streams never overlap text. The accent edge always faces *inward* toward the stream (`pin-left`/`pin-right`). `layoutComments()` re-runs on resize.

## Working conventions

- **This build proceeds incrementally — extend the existing pattern, don't rewrite.** The page was deliberately stripped to a foundation; elements (precision indicator / π-meter, right-hand content panel, S/O gauges, cessation blink) return one stage/feature at a time. Do not re-add them wholesale.
- **Change one thing at a time; keep the file self-contained; keep diffs small.** Commit at each step.
- Reuse the `:root` CSS variables — don't hardcode colors. `--gold` (precision) and `--calm` (learned-opacity accent) are currently unused, reserved for when those elements return.
- `prefers-reduced-motion` needs a static fallback when the engine grows (earlier builds rendered static line-thickness instead of streaming dots) — re-add it rather than leaving reduced-motion readers with a dead diagram.
- When a change touches the *model's claims* (not just styling), surface the interpretive choice to Björn rather than silently picking one. Two open modeling items are flagged in the handoff docs: how A&P reads in pure S/O now that R is gone, and the precision-encoding scheme (error-gain vs prior-confidence).
