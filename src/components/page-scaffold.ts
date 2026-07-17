import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Page } from './model/page';
import { LightDomElement } from './light-dom-element';
import { StageRouter } from './stage-router';
import './stage-rail';
import './flow-diagram/flow-diagram';

/* The common page shell: header, stage rail, and flow diagram, wired to a
   Page descriptor. Replaces the old mountPage()/hand-copied-HTML-skeleton
   split -- a page's bootstrap is now one render() call passing a Page, and
   the header copy, routing, and rail<->diagram wiring all live here instead
   of being spread across a page's HTML file and a free function. */
@customElement('page-scaffold')
export class PageScaffold extends LightDomElement {
  @property({ attribute: false }) page!: Page;

  private router = new StageRouter(this);

  render() {
    const { page } = this;
    const i = this.router.current;
    const stage = page.stages[i] ?? page.stages[0];

    return html`
      <div class="wrap">
        <header>
          <div class="eyebrow">${page.eyebrow}</div>
          <h1>${page.heading}</h1>
        </header>

        <main>
          <nav class="rail" aria-label="Stages">
            <stage-rail
              .stages=${page.stages}
              .current=${i}
              @stage-select=${(e: CustomEvent<{ index: number }>) => this.router.setStage(e.detail.index)}
            ></stage-rail>
          </nav>

          <flow-diagram class="diagram" .content=${{ config: page.config, stage }}></flow-diagram>
        </main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-scaffold': PageScaffold;
  }
}
