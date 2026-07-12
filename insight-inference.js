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
      intake: { in: 'med', out: 'low' }, jit: 1.5, spd: 1,
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

  function setStage(i) {
    if (i < 0 || i >= STAGES.length || i === cur) return;
    cur = i;
    target = resolveStage(STAGES[i]);
    [...rail.children].forEach((li, j) => li.classList.toggle('active', j === i));
  }

  /* ---------------- canvas ---------------- */
  const canvas = el('flow');
  const ctx = canvas.getContext('2d');
  const diagram = el('diagram');
  const tiers = [el('tier-self-high'), el('tier-self-low'), el('tier-object'), el('tier-sense')];
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
  // Pin each comment into the free space beside its gap's up-stream. Clear the
  // widest a high-intensity band can reach so a broad stream never overlaps it.
  function layoutComments() {
    const errComment = (id, upper, lower) => {
      const a = tierBox(upper), b = tierBox(lower);
      const cx = (b.left + b.right) / 2, w = b.right - b.left;
      const left = cx + w * STREAM_OFF + MAX_BREADTH + 20;
      const box = el(id);
      box.classList.add('pin-left'); // box sits right of the stream: accent faces left, inward
      box.style.top = ((a.bot + b.top) / 2) + 'px';
      box.style.left = left + 'px';
      box.style.width = (b.right - left) + 'px';
    };
    errComment('comment-high-err', tiers[0], tiers[1]); // self-deep ↔ self-low
    errComment('comment-mid-err',  tiers[1], tiers[2]); // self-low ↔ object
    errComment('comment-low-err',  tiers[2], tiers[3]); // object ↔ sensory

    // The outgoing (action) stream lives in the intake region below the sensory
    // tier, on the pred (left) side. Pin its comment into the free space to its
    // left, clearing the widest a band could reach.
    const s = tierBox(tiers[3]);
    const cx = (s.left + s.right) / 2, w = s.right - s.left;
    const right = cx - w * STREAM_OFF - MAX_BREADTH - 20;
    const outBox = el('comment-intake-out');
    outBox.classList.add('pin-right'); // box sits left of the stream: accent faces right, inward
    outBox.style.top = ((s.bot + (H - 26)) / 2) + 'px';
    outBox.style.left = s.left + 'px';
    outBox.style.width = (right - s.left) + 'px';
  }

  resize();

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

  setStage(0);
  requestAnimationFrame(frame);
})();
