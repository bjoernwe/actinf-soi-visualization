import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Layer } from '../model/diagram';
import type { TierComment } from '../model/stages';
import { monoLabel } from '../shared-styles';
import './comment-note';

/* A single layer box: title, subtitle, and (if the active stage has one) a
   terse readout docked over its own right slice. Self-sized -- min-height
   plus centered content -- so it never depends on a sibling's geometry. */
@customElement('tier-layer')
export class TierLayer extends LitElement {
  @property({ attribute: false }) layer!: Layer;
  @property({ attribute: false }) dock?: TierComment;

  static styles = css`
    :host {
      position: relative;
      display: flex; flex-direction: column; justify-content: center;
      width: var(--tier-width); margin: 0 auto;
      /* tall enough to contain a three-line docked comment with its inset;
         the content is centered so the extra height doesn't leave the box
         top-heavy. */
      min-height: 114px;
      padding: 13px 18px 14px;
      background: linear-gradient(180deg, var(--card), #171c2f);
      border: 1px solid var(--card-edge); border-radius: 9px;
      /* structure is etched into the plane, not floating above it: an inset
         top highlight + bottom shade seats each tier into the substrate, the
         opposite of a comment's drop-shadowed float. */
      box-shadow: inset 0 1px 0 rgba(233,229,216,.05),
                  inset 0 -1px 0 rgba(0,0,0,.28);
    }
    h3 { font-family: "Fraunces", serif; font-weight: 430; font-size: 17.5px; letter-spacing: .01em; }
    /* the gap to the title is opened up so the label pair sits evenly inside
       the centred box rather than clustering tight in the middle. */
    .sub {
      ${monoLabel}
      font-size: 10.5px; color: var(--muted); margin-top: 9px;
    }
    /* a docked comment covers the layer's right slice, over its text (which
       returns in stages without it); sized to its own content and centered
       vertically so the inset reads on every side. */
    comment-note.dock {
      position: absolute;
      left: calc(45% + 9px); right: 9px; top: 50%;
      transform: translateY(-50%);
    }
  `;

  render() {
    return html`
      <h3>${this.layer.title}</h3>
      <div class="sub">${this.layer.sub}</div>
      ${this.dock ? html`<comment-note class="dock" .def=${this.dock}></comment-note>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tier-layer': TierLayer;
  }
}
