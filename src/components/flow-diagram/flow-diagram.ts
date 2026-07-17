import { html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DiagramConfig } from '../model/diagram';
import type { Stage } from '../model/stages';
import { FlowEngine } from './engine';
import { LightDomElement } from '../light-dom-element';
import './tier-layer';
import './comment-note';

/* What <page-scaffold> hands this element: the DiagramConfig it's built for
   (fixed for the element's lifetime) plus whichever Stage is currently
   active. Bundled into one property -- rather than two separately-set ones
   -- so the scaffold's template has a single binding to point at
   (`.content=${{ config, stage }}`) instead of the wiring being spread
   across two. */
export interface FlowDiagramContent {
  config: DiagramConfig;
  stage: Stage;
}

/* Hosts one diagram: the canvas particle stream, the tier stack, and the
   comment layer, driven by a DiagramConfig (so a page composes whatever
   layer constellation it needs) and the currently active Stage. The canvas
   engine itself stays a plain TS class (FlowEngine) -- this component's job
   is to render the DOM the engine measures and hand it stage changes. */
@customElement('flow-diagram')
export class FlowDiagram extends LightDomElement {
  @property({ attribute: false }) content!: FlowDiagramContent;

  private engine?: FlowEngine;
  private started = false;
  private onResize = () => this.engine?.resize();

  render() {
    return html`
      <canvas id="flow"></canvas>
      <div class="axis" aria-hidden="true"></div>
      <div class="tier-stack">
        ${this.content.config.layers.map(l => html`
          <tier-layer class="tier" id=${'tier-' + l.id} .layer=${l}></tier-layer>
        `)}
      </div>
      <div class="stream-label">the incoming stream</div>
      <div class="comments"></div>
    `;
  }

  firstUpdated(): void {
    const canvas = this.querySelector('#flow') as HTMLCanvasElement;
    const tiers = [...this.querySelectorAll('tier-layer')] as HTMLElement[];
    const commentContainer = this.querySelector('.comments') as HTMLElement;
    this.engine = new FlowEngine(canvas, this, tiers, this.content.config, this.content.stage, commentContainer);
    this.engine.resize();
    this.engine.start();
    window.addEventListener('resize', this.onResize);
    // Docks are centred from their measured height, so re-place them once the
    // web font swaps in and line-wrapping (hence height) may have changed.
    if (document.fonts?.ready) document.fonts.ready.then(() => this.engine?.comments.layout());
    this.started = true;
  }

  // Fires after firstUpdated() on the very first pass too, so this is the
  // single place a stage change (including the initial one) reaches the
  // engine -- no separate call needed in firstUpdated().
  updated(changed: PropertyValues): void {
    if (this.started && changed.has('content')) this.engine!.setStage(this.content.stage);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.onResize);
    this.engine?.stop();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flow-diagram': FlowDiagram;
  }
}
