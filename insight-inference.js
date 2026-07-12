(() => {
  /* ---------------- intensity system ----------------
     A stream's intensity reads on three channels at once, so the level is
     legible in a still frame and even in grayscale:
       breadth  – how wide the band of bubbles spreads (the primary cue)
       rate     – bubbles spawned per second
       alpha    – colour strength
       size     – bubble radius
     Everything downstream speaks in 'low' | 'med' | 'high'. */
  const INTENSITY = {
    low:  { breadth:  5, rate:  3.2, alpha: 0.42, size: 1.9 },
    med:  { breadth: 12, rate:  7.0, alpha: 0.68, size: 2.3 },
    high: { breadth: 21, rate: 12.5, alpha: 0.92, size: 2.7 },
  };
  const MAX_BREADTH = INTENSITY.high.breadth;

  /* ---------------- stages ----------------
     Each of the three gaps carries a `down` stream (predictions, blue) and an
     `up` stream (prediction error, orange). A stage assigns each an intensity
     level; clicking the rail tweens between stages. `intake` covers the bottom
     region below the sensory layer: an `in` stream (sensory inflow, up, err) and
     an `out` stream (outward action, down, pred), each carrying its own level.

     Baseline is authored to match the comment slots' narrative:
       g0  deeper self ↔ low self : auto-pilot, relaxed        → low / low
       g1  low self ↔ object      : object-related selfing loop → high / high
       g2  object ↔ sensory       : details predicted away      → high / low   */
  const STAGES = [
    {
      short: 'Baseline',
      streams: {
        g0: { down: 'med',  up: 'low'  },
        g1: { down: 'high', up: 'high' },
        g2: { down: 'med', up: 'low'  },
      },
      intake: { in: 'med', out: 'med' }, jit: 1.5, spd: 1,
      // Per-stage annotations. An entry anchors one of two ways:
      //   gap-anchored  — a gloss on a loop, floating beside a stream:
      //     gap:  'g0' | 'g1' | 'g2' | 'intake'
      //     side: 'right' (err / sensory-inflow side) | 'left' (pred / action side)
      //   tier-anchored — a terse readout docked onto a layer's right, over its
      //     text (which returns in stages without the note):
      //     tier: 'self-high' | 'self-low' | 'object' | 'sense'
      //     icon: optional emoji, rendered upright in its own column beside
      //       the (italic) body so it never inherits the slant and multi-line
      //       bodies stay flush past it, not indented under the glyph.
      // Add, drop, or move entries freely — count and placement can differ per stage.
      comments: [
        { gap: 'g0', tag: 'Deeper Self Auto-Pilot', body: 'During every-day baseline, deeper self structures are semi-relaxed, slightly re-confirming and rarely updating.' },
        { gap: 'g1', side: 'left', tag: '🖐️️ High Object-Related Selfing', body: 'The tightest inference loop happens between self layer and everyday objects.' },
        { gap: 'g2', side: 'right', tag: 'Details Predicted Away', body: 'Most sensory details are predicted away.' },
        { gap: 'intake', side: 'left', tag: 'Outward Actions', body: 'Actions are modeled as active inference on the outside.' },
      ],
    },
    {
      short: 'Entry',
      streams: {
        g0: { down: 'med',  up: 'low'  },
        g1: { down: 'med', up: 'med'  },
        g2: { down: 'med',  up: 'high'  },
      },
      intake: { in: 'med', out: 'low' }, jit: 1.3, spd: 1,
      comments: [
        { gap: 'g1', side: 'left', tag: '🧘 Cultivated Equanimity', body: 'Relaxing preferences around how objects *should* be.' },
        { tier: 'object', icon: '💡', body: 'Objects start to become more fluid and interesting.' },
        { gap: 'g2', side: 'left', tag: 'Perceived Details (2)', body: 'Object layer adjusts to predict sensory input in more detail.' },
        { gap: 'g2', side: 'right', tag: 'Perceived Details (1)', body: 'Increased prediction error due to attention.' },
        { tier: 'sense', icon: '🧘', body: 'Attention (i.e., increased precision) is placed on the sensory input.' },
        { gap: 'intake', side: 'left', tag: '🧘 Seated Meditation',  body: 'Sitting still minimizes active inference (i.e., action) on the environment.' },
      ],
    },
    {
      short: 'A&P',
      streams: {
        g0: { down: 'med',  up: 'low' },
        g1: { down: 'med', up: 'low' },
        g2: { down: 'high', up: 'high' },
      },
      intake: { in: 'med', out: 'low' }, jit: 2, spd: 1.35,
      comments: [
      ],
    },
  ];

  const GAPS = ['g0', 'g1', 'g2'];
  const DIRS = ['down', 'up'];
  const FIELDS = ['breadth', 'rate', 'alpha', 'size'];

  // Flatten a stage's level names into tweenable numbers.
  function resolveStage(s) {
    const streams = {};
    for (const g of GAPS) {
      streams[g] = {
        down: { ...INTENSITY[s.streams[g].down] },
        up:   { ...INTENSITY[s.streams[g].up] },
      };
    }
    const intake = {
      in:  { ...INTENSITY[s.intake.in]  },
      out: { ...INTENSITY[s.intake.out] },
    };
    return { streams, intake, jit: s.jit, spd: s.spd };
  }

  /* ---------------- DOM: rail ---------------- */
  const rail = document.getElementById('rail');
  STAGES.forEach((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button class="stage-link" data-i="${i}">${s.short}</button>`;
    rail.appendChild(li);
  });
  rail.addEventListener('click', e => {
    const b = e.target.closest('button.stage-link');
    if (b) setStage(+b.dataset.i);
  });

  /* prev / next navigation */
  const prevBtn = document.getElementById('prev-stage');
  const nextBtn = document.getElementById('next-stage');
  prevBtn.addEventListener('click', () => setStage(cur - 1));
  nextBtn.addEventListener('click', () => setStage(cur + 1));

  const el = id => document.getElementById(id);

  /* how far the pred/err streams sit from a gap's center, as a fraction of tier
     width. Smaller = streams hug the center, leaving side room for comment slots. */
  const STREAM_OFF = 0.05;

  /* ---------------- colors ---------------- */
  const C = { pred: [139, 158, 232], err: [232, 140, 74] };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* ---------------- state + tween ---------------- */
  let cur = -1;
  const live = resolveStage(STAGES[0]);
  let target = resolveStage(STAGES[0]);

  /* URL hash <-> stage. Each stage gets a slug (from its `short` name) so the
     current stage survives a refresh and is shareable/bookmarkable. */
  const slug = s => s.short.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  function stageFromHash() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    return STAGES.findIndex(s => slug(s) === h);
  }

  function setStage(i) {
    if (i < 0 || i >= STAGES.length || i === cur) return;
    cur = i;
    target = resolveStage(STAGES[i]);
    renderComments(STAGES[i]);
    [...rail.children].forEach((li, j) => li.classList.toggle('active', j === i));
    prevBtn.disabled = i <= 0;
    nextBtn.disabled = i >= STAGES.length - 1;
    location.hash = slug(STAGES[i]);
  }

  // Back/forward and manual hash edits move the stage too.
  window.addEventListener('hashchange', () => {
    const i = stageFromHash();
    if (i >= 0) setStage(i);
  });

  /* ---------------- canvas ---------------- */
  const canvas = el('flow');
  const ctx = canvas.getContext('2d');
  const diagram = el('diagram');
  const tiers = [el('tier-self-high'), el('tier-self-low'), el('tier-object'), el('tier-sense')];
  const TIER_INDEX = { 'self-high': 0, 'self-low': 1, 'object': 2, 'sense': 3 };
  /* a docked tier comment covers the right slice of its layer box; the label
     survives on the left up to this fraction of the tier width. DOCK_PAD is the
     breathing room the card leaves inside the layer's edges. */
  const DOCK_START = 0.45;
  const DOCK_PAD = 9;
  let W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = diagram.clientWidth; H = diagram.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutComments();
  }
  window.addEventListener('resize', resize);

  /* ---------------- comment slots ---------------- */
  // A tier's box in diagram-local coords.
  function tierBox(t) {
    const dRect = diagram.getBoundingClientRect();
    const b = t.getBoundingClientRect();
    return { top: b.top - dRect.top, bot: b.bottom - dRect.top, left: b.left - dRect.left, right: b.right - dRect.left };
  }
  // Vertical center (diagram coords) of a gap or the intake region.
  function regionCenterY(gap) {
    if (gap === 'intake') {
      const s = tierBox(tiers[tiers.length - 1]);
      return (s.bot + (H - 26)) / 2;
    }
    const i = +gap[1];
    return (tierBox(tiers[i]).bot + tierBox(tiers[i + 1]).top) / 2;
  }

  // Position a comment. Two modes:
  //   tier-anchored — dock onto the right slice of a layer box, over its text,
  //     full box height; the inward rule (pin-left) divides label from note.
  //   gap-anchored  — pin beside a stream. The accent edge always faces inward,
  //     toward the stream: a box on the right gets pin-left, one on the left
  //     pin-right. Clear the widest a high-intensity band can reach so a broad
  //     stream never overlaps it. All tiers share one horizontal box, so
  //     tiers[0] suffices.
  function placeComment(box, def) {
    box.classList.remove('pin-left', 'pin-right');
    if (def.tier != null) {
      const t = tierBox(tiers[TIER_INDEX[def.tier]]);
      const left = t.left + (t.right - t.left) * DOCK_START + DOCK_PAD;
      box.style.left = left + 'px';
      box.style.width = (t.right - DOCK_PAD - left) + 'px';
      // Size to content, then centre in the layer so the inset reads on every
      // side. Width is set first so offsetHeight reflects the wrapped body.
      box.style.height = '';
      box.style.top = ((t.top + t.bot) / 2 - box.offsetHeight / 2) + 'px';
      return;
    }
    const { gap, side } = def;
    const t = tierBox(tiers[0]);
    const cx = (t.left + t.right) / 2, w = t.right - t.left;
    box.style.top = regionCenterY(gap) + 'px';
    if (side === 'left') {
      const right = cx - w * STREAM_OFF - MAX_BREADTH - 20;
      box.classList.add('pin-right'); // box left of stream: accent faces right, inward
      box.style.left = t.left + 'px';
      box.style.width = (right - t.left) + 'px';
    } else {
      const left = cx + w * STREAM_OFF + MAX_BREADTH + 20;
      box.classList.add('pin-left'); // box right of stream: accent faces left, inward
      box.style.left = left + 'px';
      box.style.width = (t.right - left) + 'px';
    }
  }

  // Re-position the current stage's comment boxes (on stage change + resize).
  function layoutComments() {
    for (const { def, box } of activeComments) placeComment(box, def);
  }

  // Inline emphasis for comment bodies: *word* -> a stressed span. The body is
  // set in italic serif, so .stress reads by standing upright (see CSS), the
  // inverse of markdown's usual italic. Split on '*' and alternate plain text /
  // emphasis (odd fragments are inside a pair); each fragment is written as a
  // text node, so an authored string can never inject markup.
  function fillBody(p, text) {
    text.split('*').forEach((frag, i) => {
      if (!frag) return;
      if (i % 2) {
        const em = document.createElement('em');
        em.className = 'stress';
        em.textContent = frag;
        p.appendChild(em);
      } else {
        p.appendChild(document.createTextNode(frag));
      }
    });
  }

  // Build and place the comment boxes for a stage. Rebuilt on each stage change,
  // so text, count, and placement can all differ from stage to stage.
  const commentLayer = el('comments');
  let activeComments = [];
  function renderComments(stage) {
    commentLayer.innerHTML = '';
    activeComments = (stage.comments || []).map(def => {
      const box = document.createElement('aside');
      box.className = def.tier != null ? 'comment dock' : 'comment';
      // Gap comments carry a tag; a dock gives its whole box to the body.
      if (def.tier == null) {
        const tag = document.createElement('div');
        tag.className = 'comment-tag';
        tag.textContent = def.tag;
        box.appendChild(tag);
      }
      // A dock's icon gets its own upright column beside the (italic) body,
      // so it never inherits the slant and multi-line text stays flush past it.
      if (def.icon) {
        const icon = document.createElement('span');
        icon.className = 'comment-icon';
        icon.textContent = def.icon;
        box.appendChild(icon);
      }
      const p = document.createElement('p');
      fillBody(p, def.body);
      box.appendChild(p);
      commentLayer.appendChild(box);
      return { def, box };
    });
    layoutComments();
  }

  resize();
  // Docks are centred from their measured height, so re-place them once the
  // web font swaps in and line-wrapping (hence height) may have changed.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutComments);

  function geom() {
    const dRect = diagram.getBoundingClientRect();
    const r = tiers.map(t => {
      const b = t.getBoundingClientRect();
      return { top: b.top - dRect.top, bot: b.bottom - dRect.top, left: b.left - dRect.left, right: b.right - dRect.left };
    });
    const cx = (r[0].left + r[0].right) / 2;
    const w = r[0].right - r[0].left;
    const predX = cx - w * STREAM_OFF, errX = cx + w * STREAM_OFF;
    const gaps = [];
    for (let i = 0; i < r.length - 1; i++) {
      gaps.push({ top: r[i].bot + 6, bot: r[i + 1].top - 6, predX, errX });
    }
    return {
      gaps,
      intake: { top: r[r.length - 1].bot + 6, bot: H - 26, inX: errX, outX: predX }
    };
  }

  const parts = [];
  const acc = { g0down: 0, g0up: 0, g1down: 0, g1up: 0, g2down: 0, g2up: 0, intake_in: 0, intake_out: 0 };

  // Gap-stream bubble. `ox` is a center-weighted offset in [-1, 1]; the render
  // loop scales it by the stream's live breadth, so the whole band widens or
  // narrows smoothly as intensity tweens.
  function spawn(gap, dir) {
    parts.push({
      gap, dir, t: 0,
      v: 0.35 + Math.random() * 0.3,
      ph: Math.random() * Math.PI * 2,
      fq: 2 + Math.random() * 5,
      ox: Math.random() + Math.random() - 1,
    });
  }
  // `dir` is 'in' (sensory inflow, up) or 'out' (outward action, down). Like the
  // gap streams, `ox` is center-weighted and scaled by live breadth at render.
  function spawnIntake(dir) {
    parts.push({
      intake: dir, t: 0,
      v: 0.35 + Math.random() * 0.3,
      ph: Math.random() * Math.PI * 2,
      fq: 2 + Math.random() * 5,
      ox: Math.random() + Math.random() - 1,
    });
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const k = 1 - Math.exp(-dt * 3.2);
    for (const g of GAPS) for (const d of DIRS) for (const f of FIELDS) {
      const l = live.streams[g][d], t = target.streams[g][d];
      l[f] += (t[f] - l[f]) * k;
    }
    for (const d of ['in', 'out']) for (const f of FIELDS) {
      const l = live.intake[d], t = target.intake[d];
      l[f] += (t[f] - l[f]) * k;
    }
    for (const key of ['jit', 'spd']) live[key] += (target[key] - live[key]) * k;

    ctx.clearRect(0, 0, W, H);
    const G = geom();

    const trySpawn = (key, rate, fn) => {
      acc[key] += rate * dt;
      while (acc[key] >= 1) { acc[key] -= 1; fn(); }
    };
    for (const g of GAPS) for (const d of DIRS) {
      const gi = +g[1];
      trySpawn(g + d, live.streams[g][d].rate, () => spawn(gi, d));
    }
    trySpawn('intake_in',  live.intake.in.rate,  () => spawnIntake('in'));
    trySpawn('intake_out', live.intake.out.rate, () => spawnIntake('out'));

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += p.v * live.spd * dt;
      if (p.t >= 1) { parts.splice(i, 1); continue; }

      let x, y, col, alpha, rad;
      if (p.intake) {
        const g = G.intake;
        const s = live.intake[p.intake];
        const up = p.intake === 'in';
        const x0 = up ? g.inX : g.outX;
        x = x0 + p.ox * s.breadth + Math.sin(p.t * p.fq + p.ph) * live.jit;
        y = up ? g.bot + (g.top - g.bot) * p.t : g.top + (g.bot - g.top) * p.t;
        col = up ? C.err : C.pred;
        alpha = s.alpha; rad = s.size;
      } else {
        const g = G.gaps[p.gap];
        const sd = live.streams['g' + p.gap][p.dir];
        const down = p.dir === 'down';
        const x0 = down ? g.predX : g.errX;
        x = x0 + p.ox * sd.breadth + Math.sin(p.t * p.fq + p.ph) * live.jit;
        y = down ? g.top + (g.bot - g.top) * p.t : g.bot + (g.top - g.bot) * p.t;
        col = down ? C.pred : C.err;
        alpha = sd.alpha; rad = sd.size;
      }
      const edge = Math.min(p.t, 1 - p.t) * 6;
      alpha *= Math.min(edge, 1);

      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fillStyle = rgba(col, alpha);
      ctx.shadowColor = rgba(col, alpha * .9);
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(frame);
  }

  const initial = stageFromHash();
  setStage(initial >= 0 ? initial : 0);
  requestAnimationFrame(frame);
})();
