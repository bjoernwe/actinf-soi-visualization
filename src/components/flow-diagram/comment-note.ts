import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Comment } from '../../stages';
import { LightDomElement } from '../light-dom-element';

/* Renders one comment's content (tag/icon/body). Positioning and the
   comment/dock class are handled by CommentLayer (comments.ts), which owns
   the geometry math and needs the class applied synchronously at creation --
   see the note there on why that can't be this component's own job. */
@customElement('comment-note')
export class CommentNote extends LightDomElement {
  @property({ attribute: false }) def!: Comment;

  render() {
    const def = this.def;
    const isTier = 'tier' in def;
    return html`
      ${!isTier ? html`<div class="comment-tag">${def.tag}</div>` : nothing}
      ${isTier && def.icon ? html`<span class="comment-icon">${def.icon}</span>` : nothing}
      <p>${this.renderBody(def.body)}</p>
    `;
  }

  // Inline emphasis: *word* -> a stressed span. The body is set in italic
  // serif, so .stress reads by standing upright (see CSS), the inverse of
  // markdown's usual italic.
  private renderBody(text: string) {
    return text.split('*').map((frag, i) => (i % 2 ? html`<em class="stress">${frag}</em>` : frag));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'comment-note': CommentNote;
  }
}
