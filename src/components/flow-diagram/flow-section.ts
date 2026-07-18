import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { INTENSITY, COLORS, MAX_BREADTH, type Level, type IntensityValues } from '../model/model';
import type { GapComment } from '../model/stages';
import { monoLabel } from '../shared-styles';
import './comment-note';

const FIELDS: (keyof IntensityValues)[] = ['breadth', 'rate', 'alpha', 'size'];
const rgba = (c: readonly [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/* how far the pred/err lanes sit from center, as a fraction of the section's
   own width -- must match --stream-off below, which reserves the same
   fraction for the comment columns' inner clearance. */
const STREAM_OFF = 0.05;

interface Particle { dir: 'down' | 'up'; t: number; v: number; ph: number; fq: number; ox: number; }
type Lanes = Record<'down' | 'up', IntensityValues>;

/* One flow region: the streaming canvas between two tiers, or the intake
   region below the last one. Self-contained -- owns its own canvas, tween,
   particle pool, height, and comment placement, so resizing one (its height
   is a plain CSS custom property) can never affect any other region or the
   rest of the page. `down` always renders as the descending prediction lane
   (periwinkle) and `up` as the ascending error lane (ember); the intake
   region is wired to the same two props (down=out, up=in) rather than
   needing its own rendering path, since the direction semantics already
   line up (outward action reads as a prediction, sensory inflow as an
   error). */
@customElement('flow-section')
export class FlowSection extends LitElement {
  @property({ type: String }) down: Level = 'low';
  @property({ type: String }) up: Level = 'low';
  @property({ type: Number }) jit = 1;
  @property({ type: Number }) spd = 1;
  @property({ attribute: false }) comments: GapComment[] = [];
  @property({ type: Boolean, reflect: true }) intake = false;
  @property({ type: String }) label?: string;

  static styles = css`
    :host {
      position: relative;
      display: grid;
      /* clear the widest a high-intensity band can reach (--max-breadth) plus
         a fixed comment gap, on both sides of the lane pair, so a comment
         column never overlaps a full-breadth stream. */
      grid-template-columns:
        calc(50% - var(--stream-off) - var(--max-breadth) - 20px)
        calc(2 * (var(--stream-off) + var(--max-breadth) + 20px))
        calc(50% - var(--stream-off) - var(--max-breadth) - 20px);
      width: var(--tier-width);
      margin: 0 auto;
      height: var(--flow-height, 130px);
    }
    :host([intake]) { height: var(--intake-height, 160px); }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; grid-column: 1 / -1; z-index: 1; }
    .side {
      position: relative; z-index: 2;
      display: flex; flex-direction: column; justify-content: center; gap: 10px;
      pointer-events: none;
    }
    .side comment-note { pointer-events: auto; }
    .side.left  { grid-column: 1; align-items: flex-end; }
    .side.right { grid-column: 3; align-items: flex-start; }
    .label {
      position: absolute; bottom: 6px; left: 0; right: 0; text-align: center;
      z-index: 2; color: #565c78;
      ${monoLabel}
      font-size: 10.5px;
    }
  `;

  @query('canvas') private canvas!: HTMLCanvasElement;

  private live: Lanes = { down: { ...INTENSITY.low }, up: { ...INTENSITY.low } };
  private target: Lanes = { down: { ...INTENSITY.low }, up: { ...INTENSITY.low } };
  private parts: Particle[] = [];
  private acc = { down: 0, up: 0 };
  private last = 0;
  private rafId = 0;
  private ro?: ResizeObserver;
  private ctx!: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private dpr = 1;

  connectedCallback(): void {
    super.connectedCallback();
    this.live = { down: { ...INTENSITY[this.down] }, up: { ...INTENSITY[this.up] } };
    this.target = { down: { ...INTENSITY[this.down] }, up: { ...INTENSITY[this.up] } };
    // --max-breadth sizes the comment-clearing columns (see :host's
    // grid-template-columns below); set from the same INTENSITY table the
    // canvas reads its breadth from, so the two can't drift apart.
    this.style.setProperty('--max-breadth', `${MAX_BREADTH}px`);
  }

  firstUpdated(): void {
    this.ctx = this.canvas.getContext('2d')!;
    // A ResizeObserver (not a `window` resize listener) so any reason the
    // box's rendered size changes -- viewport resize, a taller comment
    // reflowing a tier, a CSS var edit picked up by HMR, a font swap -- is
    // caught the same way; there is no cached height to go stale.
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this);
    this.resize();
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  updated(changed: PropertyValues): void {
    if (changed.has('down') || changed.has('up')) {
      this.target = { down: { ...INTENSITY[this.down] }, up: { ...INTENSITY[this.up] } };
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.ro?.disconnect();
    cancelAnimationFrame(this.rafId);
  }

  private resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    const r = this.getBoundingClientRect();
    this.W = r.width; this.H = r.height;
    this.canvas.width = this.W * this.dpr;
    this.canvas.height = this.H * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // `ox` is a center-weighted offset in [-1, 1]; the render loop scales it by
  // the lane's live breadth, so the whole band widens or narrows smoothly as
  // intensity tweens.
  private spawn(dir: 'down' | 'up'): void {
    this.parts.push({
      dir, t: 0,
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
    for (const d of ['down', 'up'] as const) for (const f of FIELDS) {
      const l = this.live[d], t = this.target[d];
      l[f] += (t[f] - l[f]) * k;
    }

    this.ctx.clearRect(0, 0, this.W, this.H);

    const predX = this.W * (0.5 - STREAM_OFF), errX = this.W * (0.5 + STREAM_OFF);

    const trySpawn = (key: 'down' | 'up') => {
      this.acc[key] += this.live[key].rate * dt;
      while (this.acc[key] >= 1) { this.acc[key] -= 1; this.spawn(key); }
    };
    trySpawn('down'); trySpawn('up');

    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.t += p.v * this.spd * dt;
      if (p.t >= 1) { this.parts.splice(i, 1); continue; }

      const down = p.dir === 'down';
      const lane = this.live[p.dir];
      const x0 = down ? predX : errX;
      const x = x0 + p.ox * lane.breadth + Math.sin(p.t * p.fq + p.ph) * this.jit;
      // predictions descend (t=0 at top -> t=1 at bottom); error ascends.
      const y = down ? this.H * p.t : this.H * (1 - p.t);
      const col = down ? COLORS.pred : COLORS.err;
      const edge = Math.min(p.t, 1 - p.t) * 6;
      const alpha = lane.alpha * Math.min(edge, 1);

      this.ctx.beginPath();
      this.ctx.arc(x, y, lane.size, 0, Math.PI * 2);
      this.ctx.fillStyle = rgba(col, alpha);
      this.ctx.shadowColor = rgba(col, alpha * .9);
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    this.rafId = requestAnimationFrame(this.frame);
  };

  render() {
    const left = this.comments.filter(c => (c.side ?? 'right') === 'left');
    const right = this.comments.filter(c => (c.side ?? 'right') === 'right');
    return html`
      <canvas></canvas>
      <div class="side left">
        ${left.map(c => html`<comment-note class="pin-right" .def=${c}></comment-note>`)}
      </div>
      <div class="side right">
        ${right.map(c => html`<comment-note class="pin-left" .def=${c}></comment-note>`)}
      </div>
      ${this.label ? html`<div class="label">${this.label}</div>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flow-section': FlowSection;
  }
}
