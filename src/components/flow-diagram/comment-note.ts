import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Comment } from '../model/stages';
import { monoLabel, commentVoice } from '../shared-styles';

/* Renders one comment: its own float, rule, tag/icon/body skin, and
   placement inside whichever parent hosts it (flow-section pins one beside
   a stream; tier-layer docks one over a layer's text). The host classes
   ('pin-left' | 'pin-right' | 'dock') are applied by that parent -- it owns
   the anchor decision, this component only owns how a comment looks --
   including whether it's faded, which is why that's a reflected attribute
   set from `def.faded` here rather than another class the parent has to
   remember to pass through. */
@customElement('comment-note')
export class CommentNote extends LitElement {
  @property({ attribute: false }) def!: Comment;

  protected willUpdate(changed: PropertyValues): void {
    if (changed.has('def')) this.toggleAttribute('faded', !!this.def.faded);
  }

  connectedCallback(): void {
    super.connectedCallback();
    // The entrance animation (`commentIn`/`dockIn` below) holds its `to`
    // keyframe's opacity:1 at the CSS-animation cascade layer for as long as
    // it's "in effect" under fill-mode both -- which outranks the plain
    // :host([faded]) rule below and would pin every comment at full opacity
    // forever. Once the entrance finishes, `.settled` takes the animation
    // out of the selector (see the reduced-motion block) and hands opacity
    // back to the ordinary cascade, where faded and its transition apply.
    this.addEventListener('animationend', () => this.classList.add('settled'), { once: true });
  }

  static styles = css`
    :host {
      display: block;
      max-width: 300px;
      padding: 9px 16px 11px;
      background: rgba(16,19,31,.5);
      border-radius: 3px;
      box-shadow: 0 10px 26px rgba(0,0,0,.42);
      backdrop-filter: blur(3px);
      /* the inward rule, softened so it reads as a quiet anchor rather than a
         hard bar -- a dimmed tint of the note accent. One knob for both sides. */
      --rule: color-mix(in srgb, var(--comment-accent) 55%, transparent);
      transition: opacity .5s ease, filter .5s ease;
    }
    /* A comment an author carries forward from an earlier stage rather than
       drops -- see "faded" on Comment. Recedes toward the backdrop (dimmed,
       desaturated, rule muted) instead of disappearing, so a fresh comment
       elsewhere reads as the one thing that changed. Transition lives on
       :host itself (above) so stepping into *and* out of faded both animate,
       not just the entrance. */
    :host([faded]) {
      opacity: .4;
      filter: saturate(.5);
    }
    :host([faded]:hover) { opacity: .75; }
    /* the inward rule is the only edge; the note sits flush against it
       (square corners on that side) and stays soft on the outer side. Which
       side is inward is the parent's call (pin-right = anchored on the
       stream's right, so the rule faces right; vice versa for pin-left). */
    :host(.pin-left)  { border-left:  2px solid var(--rule); border-top-left-radius:  0; border-bottom-left-radius:  0; }
    :host(.pin-right) { border-right: 2px solid var(--rule); border-top-right-radius: 0; border-bottom-right-radius: 0; }

    /* Docked variant -- a note that covers a layer's right, over its text
       (which returns in stages without it). Keeps the floating skin (blur,
       drop shadow, inherited above) but carries a full hairline border and a
       near-opaque fill, so it reads as a distinct card resting inside the
       layer rather than part of it. */
    :host(.dock) {
      max-width: none;
      padding: 14px 13px;
      border-radius: 9px;
      border: 1px solid color-mix(in srgb, var(--comment-accent) 30%, transparent);
      background: rgba(16,19,31,.72);
      display: flex;
      align-items: flex-start;
      gap: 7px;
    }
    /* the lifted emoji: upright (never inherits the body's italic slant) and
       line-height-matched to the body so it aligns with the first line. */
    .comment-icon {
      flex: none;
      font-style: normal;
      font-size: 15px;
      line-height: 1.5;
    }
    .comment-tag {
      ${monoLabel}
      font-size: 10px;
      margin-bottom: 6px;
      color: var(--comment-accent);
    }
    p {
      ${commentVoice}
      margin: 0;
      font-size: 14.5px;
      line-height: 1.5;
      color: var(--vellum);
    }
    /* Authored emphasis (*word* in a comment body). The body is already
       italic, so a stressed word reads by standing *upright* -- the inverse
       of markdown's usual italic -- with a touch more weight. */
    .stress { font-style: normal; font-weight: 500; }

    /* Comments are rebuilt on every stage change, so this entrance replays
       each time: the commentary settles in anew while the structure stays
       put. */
    @media (prefers-reduced-motion: no-preference) {
      :host(:not(.settled)) { animation: commentIn .42s cubic-bezier(.2,.7,.2,1) both; }
      :host(.dock:not(.settled)) { animation: dockIn .42s cubic-bezier(.2,.7,.2,1) both; }
    }
    @keyframes commentIn {
      from { opacity: 0; transform: translateY(5px); filter: blur(2px); }
      to   { opacity: 1; transform: none;             filter: blur(0);   }
    }
    /* the dock slides in from the right -- reading as the note sliding over
       the layer to cover it. Both keyframes keep the translateY(-50%) that
       tier-layer applies externally for vertical centering -- ending on
       transform: none would clobber it once the animation's fill-mode holds
       the final keyframe. */
    @keyframes dockIn {
      from { opacity: 0; transform: translateY(-50%) translateX(7px); filter: blur(2px); }
      to   { opacity: 1; transform: translateY(-50%);                 filter: blur(0);   }
    }
  `;

  render() {
    const def = this.def;
    const isTier = 'tier' in def;
    return html`
      ${!isTier ? html`<div class="comment-tag">${def.tag}</div>` : nothing}
      ${isTier && def.icon ? html`<span class="comment-icon">${def.icon}</span>` : nothing}
      <p>${this.renderBody(def.body)}</p>
    `;
  }

  // Inline emphasis: *word* -> a stressed span.
  private renderBody(text: string) {
    return text.split('*').map((frag, i) => (i % 2 ? html`<em class="stress">${frag}</em>` : frag));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'comment-note': CommentNote;
  }
}
