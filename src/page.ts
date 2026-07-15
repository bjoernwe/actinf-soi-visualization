import { type Stage, validateStage } from './stages';
import type { DiagramConfig } from './diagram';
import './components/stage-rail';
import './components/flow-diagram';

/* Wires a page's <stage-rail> and <flow-diagram> (expected once each in the
   document) to a DiagramConfig + its Stage timeline: hash routing, prev/next,
   arrow keys, and validateStage() in dev. A page's bootstrap script is just
   this call plus its own content module -- see src/pages/. */
export function mountPage(config: DiagramConfig, stages: Stage[]): void {
  if (import.meta.env.DEV) stages.forEach(s => validateStage(config, s));

  const rail = document.querySelector('stage-rail')!;
  const diagram = document.querySelector('flow-diagram')!;
  rail.stages = stages;
  diagram.config = config;

  let cur = -1;

  /* URL hash <-> stage. Each stage gets a slug (from its `short` name) so the
     current stage survives a refresh and is shareable/bookmarkable. */
  const slug = (s: Stage) => s.short.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  function stageFromHash(): number {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    return stages.findIndex(s => slug(s) === h);
  }

  function setStage(i: number): void {
    if (i < 0 || i >= stages.length || i === cur) return;
    cur = i;
    rail.current = i;
    diagram.stage = stages[i];
    location.hash = slug(stages[i]);
  }

  rail.addEventListener('stage-select', e => setStage((e as CustomEvent<{ index: number }>).detail.index));

  // Back/forward and manual hash edits move the stage too.
  window.addEventListener('hashchange', () => {
    const i = stageFromHash();
    if (i >= 0) setStage(i);
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') setStage(cur - 1);
    else if (e.key === 'ArrowRight') setStage(cur + 1);
  });

  const initial = stageFromHash();
  setStage(initial >= 0 ? initial : 0);
}
