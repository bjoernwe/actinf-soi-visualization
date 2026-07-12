# Handoff — "Progress of Insight as Hierarchical Inference"

An interactive single-page site that walks a reader through the classical
insight stages (A&P → Dissolution → Dark Night → Equanimity) reframed as one
generative model coming apart and re-fitting itself. Audience is dual-literate:
they already know the MCTB / Dharma Overground stage vocabulary **and** the
basics of predictive processing / active inference (prior, prediction error,
model update, precision are all assumed). Don't explain those primitives; use
them.

The file is `insight-inference.html` — a single self-contained file (no build
step, no dependencies except Google Fonts). Open it in a browser to see it.

---

## 1. Current state

The page has deliberately been **stripped back to a foundation** so we can
rebuild it stage by stage with tight control. Right now it contains only:

- the header (eyebrow line + title), no abstract;
- the left **rail** (stage navigator), currently one entry: "Baseline";
- the **diagram**: three stacked tiers (Self-model / Object layer / Sensory
  layer) with a canvas particle engine flowing prediction bubbles (periwinkle,
  descending) and prediction-error bubbles (ember, ascending) between them,
  plus an intake stream below the sensory tier.

Everything else has been removed on purpose and will come back incrementally:
the precision indicators (glow + π meter), the right-hand content panel
(S/O gauges, phenomenology/mechanism text, "watch" cue), the stepper
buttons, the footer. **Do not re-add these wholesale** — they return as each
stage is built. See §5.

---

## 2. The model being communicated

This is the substance. Stage copy must be faithful to it. The model tracks
**two coordinates** (a third, R/realness, was tried and dropped as redundant —
do not reintroduce it):

- **S — solidity**: precision of the object-layer priors. How thing-like,
  stable, and gripped experience is. High S = a solid world of objects.
- **O — opacity**: how much of experience the meta-model covers *as
  construction* (i.e. sees through). Low O = experience presents its contents
  but never its own constructedness (the ordinary, "transparent" case). High O
  = the constructedness itself is apparent.

Crucially, **O has two regimes**, and the difference carries most of the story:
- **effortful** opacity — policy-driven, held up by deliberate noting. Fragile;
  fails under load. This is what operates through Dissolution and into the Dark
  Night.
- **learned** opacity — a structural prior that has been trained in. Self-
  maintaining, effortless. This is Equanimity. "A well-fit prior needs no
  defending" is the one-liner for why saṅkhārupekkhā is effortless.

The **hierarchy**: three tiers ordered by temporal depth / invariance — fast &
concrete at the bottom (sensory: contact, texture, vibration), perceptual
causes in the middle (object layer: things & scenes), slowest & most invariant
at the top (self-model: deep priors, narrative, the observer). Predictions
descend, prediction errors ascend, **precision** = the gain deciding which
errors get to matter. **Attention is action**: there is no separate controller;
noting is a policy whose whole effect is to reallocate precision (typically
injecting gain into the sensory tier). Two timescales matter: **fast inference**
within a sit, **slow structural learning** across weeks; unresolved error
**accumulates**, and threshold crossings in that accumulator are what turn a
smooth process into a *staged* path.

### The stages, as arc

The trajectory mostly hugs a low-dimensional path — S falls while O rises — and
**the drama is at the points where couplings break**, not in the drift.

- **Baseline** — well-fit model. S high, O ≈ 0, transparent. Objects solid,
  real, given. Practice begins by injecting precision into the sensory tier,
  forcing detail the model normally explains away to start mattering. This is
  the perturbation that drives everything downstream.
- **A&P (udayabbaya-ñāṇa)** — a transient **coherence maximum**: the
  destabilized system slides into a newly available local optimum where rich
  sensory detail and the self-model's preferences momentarily reconcile.
  Brightness, rapture, speed, felt certainty of arrival. Shallow and local:
  grasped as attainment, it can't hold, and destabilization resumes.
  ⚠️ **Open item:** the original signature for A&P was "R decouples upward from
  S." With R dropped, this needs a re-expression purely in S/O (candidate:
  A&P as a transient *spike in precision/coherence* while S has already begun to
  soften — an off-manifold excursion). Resolve with Björn before writing final
  A&P copy.
- **Dissolution (bhaṅga-ñāṇa)** — endings become salient; the world thins and
  greys. S falls: the object layer stops asserting, descending predictions thin
  out, ascending error goes unanswered. O is still the **effortful** kind and
  still copes, because the material is merely grey, not yet threatening.
- **Dark Night (dukkha-ñāṇas, incl. Re-Observation)** — the claim that earns
  its keep: **not** just low S. It is low S **and O failing**. The effortful
  meta-frame can't hold against affective material, so the reactions themselves
  get reified — fear/misery/disgust become the new solid, real, transparent
  objects. In precision terms: higher priors that conferred value lose gain
  (world greys) while the **freed precision is captured by the reactive
  self-model**; you're welded to the aversion because opacity dropped precisely
  on the self-relevant content. Re-Observation is **metastable churn**.
- **Equanimity (saṅkhārupekkhā-ñāṇa)** — the cleanest, most falsifiable result:
  from Re-Observation to equanimity, **S barely moves**; the transition is
  motion almost purely along **O**. Sustained pressure finally updates the layer
  above the instability — a **learned structural prior that predicts the arising
  and passing of its own contents**. Opacity flips regime (effortful → learned)
  and extends to cover the reactions and the observer's own responses. Nothing
  sticks; panoramic, effortless. Change arrives already expected, so error is
  absorbed on contact.
- **Fruition (magga-phala)** — a *coda*, not another corner of S/O space. Push
  learned opacity onto the deepest prior — the **observer-model itself** — and
  the operation stops dereifying objects and dereifies the subject. The
  trajectory reaches the **edge of a frame that presupposed an observer**, and
  the frame blinks out. Cessation as discontinuity/boundary. (The earlier build
  enacted this with a brief full-diagram opacity blink.)

### Precision is really two quantities (important nuance)

A modeling subtlety we surfaced and haven't yet encoded in the visuals: each
layer has **two** precisions — the gain on its *error units* (what it sends up)
and the confidence of its *priors* (what it asserts down). S is the latter for
the object layer. They sit on a see-saw; the layer's behavior is set by their
ratio. Raising sensory error-gain makes the object layer churn faster in **both**
directions (busier downward *revision* traffic **and** hotter upward residual) —
but what rises is the *rate of revision*, not the *confidence* of each assertion;
sustained high-gain error is exactly what erodes prior precision on the slow
timescale (→ S drops). "Busy-then-quiet at the object layer" is the
A&P-into-Dissolution signature.

**Proposed encoding (decide before re-adding precision):** glow / π-meter =
**error gain** (where attention is allocated); confidence of priors carried by
the **descending particles themselves** (their opacity/thickness), with S as the
object layer's value. This keeps the two precisions visually distinct instead of
collapsing them into one gold blob (the confusion that got the single indicator
pulled). Confirm with Björn.

---

## 3. Design system (keep consistent)

Defined as CSS variables at the top of the file — reuse them, don't hardcode.

- `--ink #10131f` background; `--card #1c2136` / `--card-edge #2b3252` tiers.
- `--vellum #e9e5d8` primary text; `--muted #7b8099` secondary.
- **`--pred #8b9ee8`** periwinkle = predictions / descending. **`--err #e88c4a`**
  ember = prediction error / ascending. These two are load-bearing; the whole
  visual grammar is "blue falls, orange rises." Don't repurpose them.
- `--gold #d9b96a` was precision; `--calm #7fc7b3` was the learned-opacity
  accent. Both currently unused — reserved for when those elements return.
- Type: **Fraunces** (serif display, headings/titles), **Spline Sans** (body),
  **Spline Sans Mono** (labels, eyebrows, data — all uppercase-tracked).
- Tone: precise, unhurried, pragmatic-dharma register. Speculative but
  mechanistic; falsifiable-where-possible; never breathless or mystical.
  Existing copy is the style reference.

---

## 4. Technical architecture

One IIFE at the bottom of the file. Key pieces:

- **`STAGES`** — an array of stage configs; this is the spine. Currently each
  entry is `{ short, p }` where `p` holds the animation params. The rail is
  generated from it; `setStage(i)` swaps the active target.
- **`p` (particle params)** per stage:
  `g0p/g0e` = pred/err spawn rate for the **self↔object** gap;
  `g1p/g1e` = pred/err spawn rate for the **object↔sensory** gap;
  `inR` = intake-stream rate; `jit` = lateral jitter (churn);
  `spd` = flow speed multiplier; `pa/ea` = pred/err alpha. Rates are
  particles/sec. Everything **tweens** smoothly between stages via an
  exponential approach in `frame()` (`live` → `target`), so transitions are
  themselves meaningful — e.g. downward traffic fading as the object layer stops
  asserting into Dissolution.
- **Geometry is read from the DOM** (`geom()` uses `getBoundingClientRect` on
  the tier elements each frame), so tier positions/sizes are driven by CSS, not
  hardcoded in JS. Move a tier in CSS and the flows follow.
- Canvas is DPR-aware (`resize()`); particles are pooled in `parts[]`.
- Prior builds also had: a content panel bound in `setStage` (title, pali line,
  phen/mech HTML, watch cue, S/O gauges with a regime chip), a prev/next
  stepper + arrow-key handler, per-tier precision glow/meter driven by a
  `glow[]` param, and a `blink`-flagged cessation animation. These were removed
  in the strip-back but the patterns are simple to reinstate — `setStage`
  already has the hook shape.

### Quality floor
Responsive to mobile (breakpoint at 1060px collapses the rail to a horizontal
strip and single-column). Keyboard focus visible. `prefers-reduced-motion` was
respected in earlier builds via a static line-thickness rendering path — **re-add
that** when the particle engine grows; a reader who's set reduced-motion should
still get the diagram, just without streaming dots.

---

## 5. Roadmap / suggested next steps

Build order (Björn's call, but this is the natural sequence):

1. **Re-add the content panel** (right column) and wire `setStage` to populate
   title / stage kind / phenomenology / mechanism / "watch" text. Start with
   Baseline only. Restore the stepper + arrow-key nav once there's more than one
   stage.
2. **Re-add the precision layer** using the two-quantities encoding in §2 —
   confirm the encoding first; this was the last thing that confused a viewer,
   so get it right.
3. **Add S/O gauges** to the panel (drop the R gauge entirely).
4. **Add stages one at a time**, in map order: Baseline → A&P → Dissolution →
   Dark Night → Equanimity → Fruition coda. For each, add a `STAGES` entry with
   its `p` params + panel copy, and tune the tween so the *transition* reads
   correctly (the transitions are where the model's claims live).
5. **Resolve the two open modeling items** with Björn before finalizing the
   affected copy: (a) how A&P reads in pure S/O now that R is gone; (b) the
   precision-encoding scheme.

### Working style
Björn is a professional programmer and wants the model rendered
*mechanistically and faithfully* — favor accuracy over hand-holding, keep the
dual-literate audience in mind, and hold stage hypotheses precisely rather than
vaguely. Change one thing at a time and keep the file self-contained. When a
step touches the model's claims (not just styling), surface the interpretive
choice rather than silently picking one.
