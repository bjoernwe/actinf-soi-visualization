import { INTENSITY, MAX_BREADTH, COLORS, type IntensityValues } from './model';
import { STAGES, type Stage, type Comment, type Gap, type Dir, type Tier } from './stages';

(() => {
  const GAPS: Gap[] = ['g0', 'g1', 'g2'];
  const DIRS: Dir[] = ['down', 'up'];
  const FIELDS: (keyof IntensityValues)[] = ['breadth', 'rate', 'alpha', 'size'];

  interface ResolvedFlow { down: IntensityValues; up: IntensityValues; }
  interface ResolvedIntake { in: IntensityValues; out: IntensityValues; }
  interface ResolvedStage {
    streams: Record<Gap, ResolvedFlow>;
    intake: ResolvedIntake;
    jit: number;
    spd: number;
  }

  // Flatten a stage's level names into tweenable numbers.
  function resolveStage(s: Stage): ResolvedStage {
    const streams = {} as Record<Gap, ResolvedFlow>;
    for (const g of GAPS) {
      streams[g] = {
        down: { ...INTENSITY[s.streams[g].down] },
        up:   { ...INTENSITY[s.streams[g].up] },
      };
    }
    const intake: ResolvedIntake = {
      in:  { ...INTENSITY[s.intake.in]  },
      out: { ...INTENSITY[s.intake.out] },
    };
    return { streams, intake, jit: s.jit, spd: s.spd };
  }

  /* ---------------- DOM: rail ---------------- */
  const rail = document.getElementById('rail') as HTMLOListElement;
  STAGES.forEach((s: Stage, i: number) => {
    const li = document.createElement('li');
    li.innerHTML = `<button class="stage-link" data-i="${i}">${s.short}</button>`;
    rail.appendChild(li);
  });
  rail.addEventListener('click', e => {
    const b = (e.target as Element).closest('button.stage-link') as HTMLButtonElement | null;
    if (b) setStage(+b.dataset.i!);
  });

  /* prev / next navigation */
  const prevBtn = document.getElementById('prev-stage') as HTMLButtonElement;
  const nextBtn = document.getElementById('next-stage') as HTMLButtonElement;
  prevBtn.addEventListener('click', () => setStage(cur - 1));
  nextBtn.addEventListener('click', () => setStage(cur + 1));
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') setStage(cur - 1);
    else if (e.key === 'ArrowRight') setStage(cur + 1);
  });

  const el = (id: string) => document.getElementById(id) as HTMLElement;

  /* how far the pred/err streams sit from a gap's center, as a fraction of tier
     width. Smaller = streams hug the center, leaving side room for comment slots. */
  const STREAM_OFF = 0.05;

  const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* ---------------- state + tween ---------------- */
  let cur = -1;
  const live = resolveStage(STAGES[0]);
  let target = resolveStage(STAGES[0]);

  /* URL hash <-> stage. Each stage gets a slug (from its `short` name) so the
     current stage survives a refresh and is shareable/bookmarkable. */
  const slug = (s: Stage) => s.short.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  function stageFromHash(): number {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    return STAGES.findIndex(s => slug(s) === h);
  }

  function setStage(i: number): void {
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
  const canvas = el('flow') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const diagram = el('diagram');
  const tiers = [el('tier-self-high'), el('tier-self-low'), el('tier-object'), el('tier-sense')];
  const TIER_INDEX: Record<Tier, number> = { 'self-high': 0, 'self-low': 1, 'object': 2, 'sense': 3 };
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
  interface Box { top: number; bot: number; left: number; right: number; }
  // A tier's box in diagram-local coords.
  function tierBox(t: HTMLElement): Box {
    const dRect = diagram.getBoundingClientRect();
    const b = t.getBoundingClientRect();
    return { top: b.top - dRect.top, bot: b.bottom - dRect.top, left: b.left - dRect.left, right: b.right - dRect.left };
  }
  // Vertical center (diagram coords) of a gap or the intake region.
  function regionCenterY(gap: Gap | 'intake'): number {
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
  function placeComment(box: HTMLElement, def: Comment): void {
    box.classList.remove('pin-left', 'pin-right');
    if ('tier' in def) {
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
  function layoutComments(): void {
    for (const { def, box } of activeComments) placeComment(box, def);
  }

  // Inline emphasis for comment bodies: *word* -> a stressed span. The body is
  // set in italic serif, so .stress reads by standing upright (see CSS), the
  // inverse of markdown's usual italic. Split on '*' and alternate plain text /
  // emphasis (odd fragments are inside a pair); each fragment is written as a
  // text node, so an authored string can never inject markup.
  function fillBody(p: HTMLParagraphElement, text: string): void {
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
  let activeComments: { def: Comment; box: HTMLElement }[] = [];
  function renderComments(stage: Stage): void {
    commentLayer.innerHTML = '';
    activeComments = (stage.comments || []).map(def => {
      const box = document.createElement('aside');
      box.className = 'tier' in def ? 'comment dock' : 'comment';
      // Gap comments carry a tag; a dock gives its whole box to the body.
      if (!('tier' in def)) {
        const tag = document.createElement('div');
        tag.className = 'comment-tag';
        tag.textContent = def.tag;
        box.appendChild(tag);
      }
      // A dock's icon gets its own upright column beside the (italic) body,
      // so it never inherits the slant and multi-line text stays flush past it.
      if ('tier' in def && def.icon) {
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
        col = up ? COLORS.err : COLORS.pred;
        alpha = s.alpha; rad = s.size;
      } else {
        const g = G.gaps[p.gap];
        const sd = live.streams['g' + p.gap][p.dir];
        const down = p.dir === 'down';
        const x0 = down ? g.predX : g.errX;
        x = x0 + p.ox * sd.breadth + Math.sin(p.t * p.fq + p.ph) * live.jit;
        y = down ? g.top + (g.bot - g.top) * p.t : g.bot + (g.top - g.bot) * p.t;
        col = down ? COLORS.pred : COLORS.err;
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
