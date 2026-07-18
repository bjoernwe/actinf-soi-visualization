import { LitElement } from 'lit';

/* Every component in this app renders into its own children rather than a
   shadow root, so the document-level stylesheet (styles.css) and
   its :root tokens apply directly -- no per-component style duplication.
   See CLAUDE.md for why light DOM is the deliberate choice here. */
export class LightDomElement extends LitElement {
  createRenderRoot() {
    return this;
  }
}
