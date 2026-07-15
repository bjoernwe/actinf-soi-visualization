import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Layer } from '../diagram';

/* A single layer box. The `.tier` class and id are applied by <flow-diagram>
   directly in its own template (not here), so they're present synchronously
   as soon as the parent renders -- getBoundingClientRect() on this element is
   accurate immediately, before this component's own (Lit-scheduled, async)
   first render has painted its text. */
@customElement('tier-layer')
export class TierLayer extends LitElement {
  @property({ attribute: false }) layer!: Layer;

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <h3>${this.layer.title}</h3>
      <div class="sub">${this.layer.sub}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tier-layer': TierLayer;
  }
}
