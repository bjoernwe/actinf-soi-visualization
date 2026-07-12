# Handoff — Stage Visualization (Meditation × Active Inference)

**For:** Claude Code
**Deliverable:** the interactive hierarchy/stage visualization at the center of an existing website project.
**Author's note:** This doc captures the *model* and the *design intent*, which won't be obvious from the code alone. It does **not** assume knowledge of the repo — inspect that first (see step 0).

---

## 0. Before writing any code — orient in the existing repo

There is already a project in progress. Do **not** scaffold a new one. First:

1. Locate the project and identify the stack (framework, styling system, animation lib, build tool). Report it back before building.
2. Find and read the existing **"Baseline"** page/component. It is deliberately stripped down right now to:
   - a title + eyebrow line,
   - the **left stage rail** (stage navigation),
   - the **layer diagram** showing only prediction/error bubbles.
   It intentionally has **no precision indicator** and **no explanatory panel text** yet — those were removed to rebuild incrementally.
3. Note the conventions already in use (how layers are rendered, how the prediction/error bubbles are drawn/animated, how the stage rail drives state). **Match them.** This build proceeds by extending the existing pattern one increment at a time, not by rewriting.

If any of the above can't be found, stop and ask rather than guessing.

---

## 1. What the site is

An interactive explainer that walks a reader **step by step through the stages of a meditation "insight cycle,"** modeled in the language of Predictive Processing / Active Inference. It should be more accessible than a dense technical discussion, but it is **not** dumbed down.

**Audience:** readers fluent in *either* pragmatic-dharma phenomenology (MCTB / Dharma Overground — terms like A&P, dark night, equanimity, cessation are known to them) *or* Active Inference (hierarchy, prediction error, precision), and ideally curious about the bridge between the two. Assume literacy; don't over-explain either side, but don't assume both.

**Core spine (the four stages the walkthrough centers on):**
**Arising & Passing → Dissolution → Dark Night → Equanimity.**
Baseline is the intro/on-ramp; other stages (below) are context and can come later.

---

## 2. The model you are visualizing

### 2.1 The hierarchy
A vertical stack of layers. Bottom to top, increasing in temporal depth + invariance:

- **Sensory detail** (bottom) — raw flux: tingling, pressure, flicker, temperature.
- **Objects** (middle) — stable posited causes (the breath, the body, an "itch") that predict and explain away the detail below.
- **Self-layers** (upper) — increasingly abstract, self-relevant priors: ownership of sensation, of the body-boundary, of agency/will, of affect, and at the very top the **observer / witness-pole**. The **meta-cognitive ("opacity") capacity lives high in this self region.**

### 2.2 Two flows (this is the heart of the diagram)
- **Predictions flow DOWN** — each layer predicts the one below, "explaining away" its activity.
- **Prediction errors flow UP** — whatever a layer fails to predict propagates upward as error.

Visually: downward stream = predictions; upward stream = errors (the existing "prediction/error bubbles"). Bubble magnitude/opacity should read as error/prediction strength.

### 2.3 The two coordinates the whole model tracks
> Earlier drafts had a third coordinate, **Realness (R)**. **It has been dropped.** Do not reintroduce it. The model now tracks **two** coordinates only:

- **S — Solidity.** How firmly the object-layer's prior holds and "explains away" the detail below. **High S** = crisp, stable, solid objects. **Low S** = objects dissolve into a stream of sensation (shimmer/flux).
- **O — Opacity.** How much content is experienced *as* content (a mental event) rather than looked *through* as real/given. **Low O** = transparent, absorbed in content. **High O** = contents held as arising-and-passing process. Note O has two regimes: an early **effortful** opacity (a deliberate act, fragile) and a later **learned/stable** opacity (see Equanimity).

### 2.4 Timescale dynamics (drives the stage progression)
- **Fast inference** = a layer defending its model, correcting *downward*.
- **Slow learning / precision-decay** = a layer *yielding* when error persists past a threshold, propagating error *upward*.
- Consequence: as sustained error accumulates, a **"destabilization front" climbs the hierarchy** — each layer holds until its accumulated error crosses threshold, then yields to the layer above. **The height of this front is the single best through-line to animate across the stages.**

---

## 3. Per-stage visual spec

For each stage the diagram should express: **S**, **O**, the **error-flow** state, and the **front height**. `▲` = core-spine stage.

| Stage | S (solidity) | O (opacity) | Error flow / front | Phenomenology cue for the visual |
|---|---|---|---|---|
| **Baseline** | high | low | little error; front at bottom | Solid, calm, ordinary. Everything owned & looked-through. (current stripped intro page) |
| **Access / Concentration** | starting to loosen | ticking up (effortful) | sensory precision up → more error rising, challenging object priors | Breath/body decompose into fields of sensation; objects "get interesting." |
| ▲ **Arising & Passing** | dropping (fluid) | high | high error momentarily *reconciled* into a bright transient minimum; front around objects/lower-self | Vibrations, brightness, pleasurable energy (piti), momentousness. **Show it as seductive/luminous.** Danger = grasping. |
| ▲ **Dissolution** | low (only passing-away) | high | error propagates up past objects into self-layers; front climbing | Objects vanish faster than they form; faint unreal/distant quality. |
| ▲ **Dark Night** (Fear/Misery/Disgust/Desire-for-deliverance) | low | **failing** (effortful opacity can't hold; reactions get reified) | high *unresolved* error in the affective self-layers; front in mid/upper self; metastable | Groundless dread, gray weight, staleness, "I want out" — and the reaction lived as solid fact. |
| **Re-Observation** | low | failing / thrashing | peak churn: several self-layers destabilized on different timescales, each almost-settling then knocked | Whipsaw "got it / lost it," restlessness. Highest-energy, worst phase. |
| ▲ **Equanimity** | low | **high & stable (learned)** — a prior that now *predicts* arising-and-passing | flux no longer generates destabilizing error; front near apex but quiet | Wide, cool, effortless; nothing sticks. **Visually the calm after the churn, not a return to solidity.** |
| **Cessation** (Conformity → gap) | — | — | front reaches the topmost persisting self-parameter; **no higher layer to catch the error → precision drops to zero → a gap** | A discontinuity. Consider rendering as a brief **blank/blink**, not a bright event. Known only retrospectively. |
| **Review** | re-forming | — | self re-forms but the pruned facet returns at lowered precision | "Something happened"; scrubbed-clean, rinsed clarity. |

---

## 4. The visualization, concretely

A single **animated hierarchy diagram** driven by the **stage rail**:

- Selecting a stage (click and/or scroll — confirm which the existing rail uses) transitions the diagram to that stage's state.
- **Solidity (S)** encoded on the object layer: crisp opaque block (high S) → grainy/translucent/dissolving into particulate sensation (low S).
- **Opacity (O)** encoded as a meta/observing treatment over the layers (e.g. a translucent "held-as-process" overlay or framing that is absent at low O, effortful/flickering when O is failing in the dark night, and steady when O is learned/stable at equanimity). Pick one legible encoding and keep it consistent.
- **Prediction bubbles** stream down, **error bubbles** stream up; their intensity per layer follows the table.
- **Destabilization front**: a highlight band that climbs the stack across the spine stages. This is the primary animated through-line — make it readable.
- Transitions between stages should be **meaningful motion** (the front rising, objects dissolving, the meta-frame stabilizing), not decorative.

**Rebuild order** (respect the incremental philosophy already in place):
1. Confirm the Baseline diagram (bubbles only) renders cleanly.
2. Add the **S encoding** to the object layer; verify it reads Baseline→A&P→Dissolution.
3. Add the **O encoding**; verify it reads across dark-night (failing) → equanimity (stable).
4. Add the **front** highlight and wire it to the stage rail across the four spine stages.
5. Only then consider re-adding the **precision indicator** and the **panel text**, and the non-spine stages (Access, Re-Observation, Cessation, Review).

Commit at each step; keep diffs small.

---

## 5. Design direction

- Tone: legible to both dharma and comp-neuro readers — neither incense-and-woo nor sterile lab. Calm, precise, a little luminous where the phenomenology earns it (A&P), sober where it doesn't (dark night, cessation).
- Restraint: largely monochrome with **one accent for predictions and one for errors**; let motion and the front carry the meaning.
- Respect `prefers-reduced-motion` (offer a static/stepped fallback — the states must read without animation).
- If you build or restyle components, consult the **frontend-design** skill for the environment's design tokens and styling constraints rather than inventing defaults.

---

## 6. Guardrails — do not

- **Do not reintroduce Realness (R).** Two coordinates only: S and O.
- **Do not** render Baseline as "solid = good / dissolved = bad." Low S is progress in this model, not failure.
- **Do not** render Cessation as a bright climactic flash; it's a **gap/discontinuity**.
- **Do not** rewrite the existing Baseline scaffolding — extend it.

---

## 7. Open questions for Björn (flag, don't assume)

1. **Layer count to render:** how many discrete layers on screen — is a 3-band (sensory / objects / self) simplification enough, or should the self region be split (ownership → agency → observer-pole) so the front's climb through *self-facets* is visible? The latter matters for the later per-path story but may overcomplicate the first pass.
2. **Navigation:** is the stage rail scroll-driven, click-driven, or both?
3. **Precision indicator:** re-add now or keep deferred? (It was deliberately stripped.)
4. **Cessation rendering:** literal blank/blink, or a subtler treatment?
5. **Scope of this pass:** just the four-stage spine, or all nine stages?
