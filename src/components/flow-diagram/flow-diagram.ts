import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DiagramConfig } from '../model/diagram';
import { gapIds } from '../model/diagram';
import type { Stage, GapComment, TierComment } from '../model/stages';
import './tier-layer';
import './flow-section';

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

/* Translates a DiagramConfig + Stage into the component tree: a <tier-layer>
   per layer, a <flow-section> per gap (plus one for the intake region below
   the last layer), each handed its own slice of the stage's streams and
   comments. Carries no geometry of its own -- every region measures and
   times itself, so growing one (a plain CSS custom property on that region)
   can't disturb any other. */
@customElement('flow-diagram')
export class FlowDiagram extends LitElement {
  @property({ attribute: false }) content!: FlowDiagramContent;

  static styles = css`
    :host {
      position: relative;
      display: flex; flex-direction: column; gap: 4px;
      border-radius: 14px;
    }
    .axis {
      position: absolute; left: 2%; top: 30px; width: 1px;
      bottom: calc(var(--intake-height, 160px) + 6px);
      background: linear-gradient(180deg, #3a4165, #262c47);
    }
    .axis::before, .axis::after {
      position: absolute; left: -4px; font-family: "Spline Sans Mono", monospace; font-size: 9.5px;
      letter-spacing: .1em; text-transform: uppercase; color: #565c78; writing-mode: vertical-rl;
    }
    .axis::before { content: "slow · invariant"; top: 0; transform: translateX(-8px); }
    .axis::after  { content: "fast · concrete";  bottom: 0; transform: translateX(-8px); }

    @media (max-width: 1060px) {
      .axis { display: none; }
    }
  `;

  render() {
    const { config, stage } = this.content;
    const gaps = gapIds(config);

    const tierComment = (id: string): TierComment | undefined =>
      stage.comments.find((c): c is TierComment => 'tier' in c && c.tier === id);
    const gapComments = (gap: string): GapComment[] =>
      stage.comments.filter((c): c is GapComment => !('tier' in c) && c.gap === gap);

    return html`
      <div class="axis" aria-hidden="true"></div>
      ${config.layers.map((layer, i) => html`
        <tier-layer .layer=${layer} .dock=${tierComment(layer.id)}></tier-layer>
        ${i < config.layers.length - 1 ? html`
          <flow-section
            .down=${stage.streams[gaps[i]].down}
            .up=${stage.streams[gaps[i]].up}
            .jit=${stage.jit}
            .spd=${stage.spd}
            .comments=${gapComments(gaps[i])}
          ></flow-section>
        ` : ''}
      `)}
      <flow-section
        intake
        label=${config.intakeLabel}
        .down=${stage.intake.out}
        .up=${stage.intake.in}
        .jit=${stage.jit}
        .spd=${stage.spd}
        .comments=${gapComments('intake')}
      ></flow-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flow-diagram': FlowDiagram;
  }
}
