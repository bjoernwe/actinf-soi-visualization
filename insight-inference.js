(() => {
  const STAGES = [
    { short: 'Baseline', p: { g0p: 9, g0e: 5, g1p: 9, g1e: 5, g2p: 10, g2e: 6, inR: 12, jit: 1.5, spd: 1, pa: .9, ea: .85 } }
  ];

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

  /* ---------------- colors ---------------- */
  const C = { pred: [139, 158, 232], err: [232, 140, 74] };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* ---------------- state + tween ---------------- */
  let cur = -1;
  const live = JSON.parse(JSON.stringify(STAGES[0].p));
  let target = STAGES[0].p;

  function setStage(i) {
    if (i < 0 || i >= STAGES.length || i === cur) return;
    cur = i;
    target = STAGES[i].p;
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
  }
  window.addEventListener('resize', resize);
  resize();

  function geom() {
    const dRect = diagram.getBoundingClientRect();
    const r = tiers.map(t => {
      const b = t.getBoundingClientRect();
      return { top: b.top - dRect.top, bot: b.bottom - dRect.top, left: b.left - dRect.left, right: b.right - dRect.left };
    });
    const cx = (r[0].left + r[0].right) / 2;
    const w = r[0].right - r[0].left;
    const predX = cx - w * 0.18, errX = cx + w * 0.18;
    const gaps = [];
    for (let i = 0; i < r.length - 1; i++) {
      gaps.push({ top: r[i].bot + 6, bot: r[i + 1].top - 6, predX, errX });
    }
    return {
      gaps,
      intake: { top: r[r.length - 1].bot + 6, bot: H - 26, x: cx, w: w * 0.5 }
    };
  }

  const parts = [];
  const acc = { g0p: 0, g0e: 0, g1p: 0, g1e: 0, g2p: 0, g2e: 0, inR: 0 };
  function spawn(kind, gapIdx) {
    parts.push({
      kind, gap: gapIdx, t: 0,
      v: (0.35 + Math.random() * 0.3),
      ph: Math.random() * Math.PI * 2,
      fq: 2 + Math.random() * 5,
      ox: (Math.random() - 0.5) * 14
    });
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const k = 1 - Math.exp(-dt * 3.2);
    for (const key of ['g0p','g0e','g1p','g1e','g2p','g2e','inR','jit','spd','pa','ea']) {
      live[key] += (target[key] - live[key]) * k;
    }

    ctx.clearRect(0, 0, W, H);
    const G = geom();

    const trySpawn = (key, rate, kind, gap) => {
      acc[key] += rate * dt;
      while (acc[key] >= 1) { acc[key] -= 1; spawn(kind, gap); }
    };
    trySpawn('g0p', live.g0p, 'pred', 0);
    trySpawn('g0e', live.g0e, 'err', 0);
    trySpawn('g1p', live.g1p, 'pred', 1);
    trySpawn('g1e', live.g1e, 'err', 1);
    trySpawn('g2p', live.g2p, 'pred', 2);
    trySpawn('g2e', live.g2e, 'err', 2);
    trySpawn('inR', live.inR, 'in', -1);

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += p.v * live.spd * dt;
      if (p.t >= 1) { parts.splice(i, 1); continue; }

      let x, y, col, alpha;
      if (p.kind === 'in') {
        const g = G.intake;
        x = g.x + p.ox * (g.w / 60) + Math.sin(p.t * p.fq + p.ph) * live.jit * .5;
        y = g.bot + (g.top - g.bot) * p.t;
        col = C.err; alpha = 0.7;
      } else {
        const g = G.gaps[p.gap];
        const down = p.kind === 'pred';
        const x0 = down ? g.predX : g.errX;
        x = x0 + p.ox * 0.4 + Math.sin(p.t * p.fq + p.ph) * live.jit;
        y = down ? g.top + (g.bot - g.top) * p.t : g.bot + (g.top - g.bot) * p.t;
        col = down ? C.pred : C.err;
        alpha = down ? live.pa : live.ea;
      }
      const edge = Math.min(p.t, 1 - p.t) * 6;
      alpha *= Math.min(edge, 1);

      ctx.beginPath();
      ctx.arc(x, y, p.kind === 'in' ? 2.4 : 2.3, 0, Math.PI * 2);
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
