import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { validateStage } from '../stages';
import type { Page } from '../page';

/* Everything mountPage() used to do to wire a rail to a Stage timeline,
   lifted into a Lit ReactiveController so <page-scaffold> can own it as a
   plain field instead of a free function reaching into the document. Owns:
   the current-stage index, URL hash <-> stage sync (both directions),
   arrow-key nav, and dev-time validateStage(). hostConnected/hostDisconnected
   register and tear down the window listeners -- mountPage()'s listeners
   never had a teardown path. */
export class StageRouter implements ReactiveController {
  current = -1;

  constructor(private host: ReactiveControllerHost & { page: Page }) {
    host.addController(this);
  }

  private get stages() {
    return this.host.page.stages;
  }

  // Each stage gets a slug (from its `short` name) so the current stage
  // survives a refresh and is shareable/bookmarkable.
  private slug(i: number): string {
    return this.stages[i].short.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private stageFromHash(): number {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    return this.stages.findIndex((_, i) => this.slug(i) === h);
  }

  setStage(i: number): void {
    if (i < 0 || i >= this.stages.length || i === this.current) return;
    this.current = i;
    location.hash = this.slug(i);
    this.host.requestUpdate();
  }

  private onHashChange = (): void => {
    const i = this.stageFromHash();
    if (i >= 0) this.setStage(i);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft') this.setStage(this.current - 1);
    else if (e.key === 'ArrowRight') this.setStage(this.current + 1);
  };

  hostConnected(): void {
    if (import.meta.env.DEV) {
      const { config, stages } = this.host.page;
      stages.forEach(s => validateStage(config, s));
    }
    window.addEventListener('hashchange', this.onHashChange);
    window.addEventListener('keydown', this.onKeyDown);
    const initial = this.stageFromHash();
    this.setStage(initial >= 0 ? initial : 0);
  }

  hostDisconnected(): void {
    window.removeEventListener('hashchange', this.onHashChange);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}
