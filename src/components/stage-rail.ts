import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { LightDomElement } from './light-dom-element';

export interface RailStage {
  short: string;
}

/* The stage timeline: a list of stage links plus prev/next. Emits
   'stage-select' (detail: { index }) rather than owning navigation itself --
   the page owns hash routing and keyboard nav (via StageRouter), since those
   are page-level concerns, not the rail's. */
@customElement('stage-rail')
export class StageRail extends LightDomElement {
  @property({ attribute: false }) stages: RailStage[] = [];
  @property({ type: Number }) current = -1;

  render() {
    return html`
      <div class="rail-title">The path</div>
      <ol>
        ${this.stages.map((s, i) => html`
          <li class=${i === this.current ? 'active' : ''}>
            <button type="button" class="stage-link" @click=${() => this.select(i)}>${s.short}</button>
          </li>
        `)}
      </ol>
      <div class="rail-nav">
        <button type="button" class="rail-nav-btn" ?disabled=${this.current <= 0} @click=${() => this.select(this.current - 1)}>&larr; Back</button>
        <button type="button" class="rail-nav-btn" ?disabled=${this.current >= this.stages.length - 1} @click=${() => this.select(this.current + 1)}>Next &rarr;</button>
      </div>
    `;
  }

  private select(i: number): void {
    if (i < 0 || i >= this.stages.length) return;
    this.dispatchEvent(new CustomEvent('stage-select', { detail: { index: i }, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'stage-rail': StageRail;
  }
}
