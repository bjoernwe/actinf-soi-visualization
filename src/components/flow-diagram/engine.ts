import { INTENSITY, COLORS, type IntensityValues } from '../../model';
import type { Stage, Dir } from '../../stages';
import { gapIds, type DiagramConfig } from '../../diagram';
import { CommentLayer } from './comments';

const DIRS: Dir[] = ['down', 'up'];
const FIELDS: (keyof IntensityValues)[] = ['breadth', 'rate', 'alpha', 'size'];
/* how far the pred/err streams sit from a gap's center, as a fraction of tier
   width. Smaller = streams hug the center, leaving side room for comment slots. */
const STREAM_OFF = 0.05;

const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

interface ResolvedFlow { down: IntensityValues; up: IntensityValues; }
interface ResolvedIntake { in: IntensityValues; out: IntensityValues; }
interface ResolvedStage {
  streams: Record<string, ResolvedFlow>;
  intake: ResolvedIntake;
  jit: number;
  spd: number;
}

// Flatten a stage's level names into tweenable numbers.
function resolveStage(gaps: string[], s: Stage): ResolvedStage {
  const streams = {} as Record<string, ResolvedFlow>;
  for (const g of gaps) {
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

interface GapParticle { gap: number; dir: Dir; t: number; v: number; ph: number; fq: number; ox: number; intake?: undefined; }
interface IntakeParticle { intake: 'in' | 'out'; t: number; v: number; ph: number; fq: number; ox: number; gap?: undefined; dir?: undefined; }
type Particle = GapParticle | IntakeParticle;

/* Owns a diagram's canvas particle stream and its comment layer together, so
   a page (or a <flow-diagram> component) only has to construct one of these
   per diagram and call resize()/setStage() on it. Generalized over an
   arbitrary DiagramConfig -- gap count and tier elements are read from it,
   not hardcoded, so the same engine drives any layer constellation. */
export class FlowEngine {
  private gaps: string[];
  private ctx: CanvasRenderingContext2D;
  private live: ResolvedStage;
  private target: ResolvedStage;
  private W = 0;
  private H = 0;
  private dpr = 1;
  private parts: Particle[] = [];
  private acc: Record<string, number>;
  private last = performance.now();
  private rafId = 0;
  readonly comments: CommentLayer;

  constructor(
    private canvas: HTMLCanvasElement,
    private diagram: HTMLElement,
    private tiers: HTMLElement[],
    config: DiagramConfig,
    initialStage: Stage,
    commentContainer: HTMLElement,
  ) {
    this.gaps = gapIds(config);
    this.ctx = canvas.getContext('2d')!;
    this.live = resolveStage(this.gaps, initialStage);
    this.target = resolveStage(this.gaps, initialStage);
    this.acc = { intake_in: 0, intake_out: 0 };
    for (const g of this.gaps) for (const d of DIRS) this.acc[g + d] = 0;
    const tierIndex = Object.fromEntries(config.layers.map((l, i) => [l.id, i]));
    this.comments = new CommentLayer(commentContainer, diagram, tiers, tierIndex, () => this.H);
  }

  // Retarget the tween and rebuild the comment layer for a newly active stage.
  setStage(stage: Stage): void {
    this.target = resolveStage(this.gaps, stage);
    this.comments.render(stage.comments);
  }

  resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.W = this.diagram.clientWidth; this.H = this.diagram.clientHeight;
    this.canvas.width = this.W * this.dpr; this.canvas.height = this.H * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.comments.layout();
  }

  start(): void {
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
  }

  private geom() {
    const dRect = this.diagram.getBoundingClientRect();
    const r = this.tiers.map(t => {
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
      intake: { top: r[r.length - 1].bot + 6, bot: this.H - 26, inX: errX, outX: predX }
    };
  }

  // Gap-stream bubble. `ox` is a center-weighted offset in [-1, 1]; the render
  // loop scales it by the stream's live breadth, so the whole band widens or
  // narrows smoothly as intensity tweens.
  private spawn(gap: number, dir: Dir): void {
    this.parts.push({
      gap, dir, t: 0,
      v: 0.35 + Math.random() * 0.3,
      ph: Math.random() * Math.PI * 2,
      fq: 2 + Math.random() * 5,
      ox: Math.random() + Math.random() - 1,
    });
  }
  // `dir` is 'in' (sensory inflow, up) or 'out' (outward action, down). Like the
  // gap streams, `ox` is center-weighted and scaled by live breadth at render.
  private spawnIntake(dir: 'in' | 'out'): void {
    this.parts.push({
      intake: dir, t: 0,
      v: 0.35 + Math.random() * 0.3,
      ph: Math.random() * Math.PI * 2,
      fq: 2 + Math.random() * 5,
      ox: Math.random() + Math.random() - 1,
    });
  }

  private frame = (now: number): void => {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;

    const k = 1 - Math.exp(-dt * 3.2);
    for (const g of this.gaps) for (const d of DIRS) for (const f of FIELDS) {
      const l = this.live.streams[g][d], t = this.target.streams[g][d];
      l[f] += (t[f] - l[f]) * k;
    }
    for (const d of ['in', 'out'] as const) for (const f of FIELDS) {
      const l = this.live.intake[d], t = this.target.intake[d];
      l[f] += (t[f] - l[f]) * k;
    }
    this.live.jit += (this.target.jit - this.live.jit) * k;
    this.live.spd += (this.target.spd - this.live.spd) * k;

    this.ctx.clearRect(0, 0, this.W, this.H);
    const G = this.geom();

    const trySpawn = (key: string, rate: number, fn: () => void) => {
      this.acc[key] += rate * dt;
      while (this.acc[key] >= 1) { this.acc[key] -= 1; fn(); }
    };
    this.gaps.forEach((g, gi) => {
      for (const d of DIRS) trySpawn(g + d, this.live.streams[g][d].rate, () => this.spawn(gi, d));
    });
    trySpawn('intake_in',  this.live.intake.in.rate,  () => this.spawnIntake('in'));
    trySpawn('intake_out', this.live.intake.out.rate, () => this.spawnIntake('out'));

    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.t += p.v * this.live.spd * dt;
      if (p.t >= 1) { this.parts.splice(i, 1); continue; }

      let x: number, y: number, col: [number, number, number], alpha: number, rad: number;
      if (p.intake) {
        const g = G.intake;
        const s = this.live.intake[p.intake];
        const up = p.intake === 'in';
        const x0 = up ? g.inX : g.outX;
        x = x0 + p.ox * s.breadth + Math.sin(p.t * p.fq + p.ph) * this.live.jit;
        y = up ? g.bot + (g.top - g.bot) * p.t : g.top + (g.bot - g.top) * p.t;
        col = up ? COLORS.err : COLORS.pred;
        alpha = s.alpha; rad = s.size;
      } else {
        const g = G.gaps[p.gap];
        const sd = this.live.streams['g' + p.gap][p.dir];
        const down = p.dir === 'down';
        const x0 = down ? g.predX : g.errX;
        x = x0 + p.ox * sd.breadth + Math.sin(p.t * p.fq + p.ph) * this.live.jit;
        y = down ? g.top + (g.bot - g.top) * p.t : g.bot + (g.top - g.bot) * p.t;
        col = down ? COLORS.pred : COLORS.err;
        alpha = sd.alpha; rad = sd.size;
      }
      const edge = Math.min(p.t, 1 - p.t) * 6;
      alpha *= Math.min(edge, 1);

      this.ctx.beginPath();
      this.ctx.arc(x, y, rad, 0, Math.PI * 2);
      this.ctx.fillStyle = rgba(col, alpha);
      this.ctx.shadowColor = rgba(col, alpha * .9);
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    this.rafId = requestAnimationFrame(this.frame);
  };
}
