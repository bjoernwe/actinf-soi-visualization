import { type Stage, validateStage } from './stages';
import { MAIN_DIAGRAM, STAGES } from './content/insight-inference';
import './components/stage-rail';
import './components/flow-diagram';

(() => {
  if (import.meta.env.DEV) STAGES.forEach(s => validateStage(MAIN_DIAGRAM, s));

  const rail = document.querySelector('stage-rail')!;
  const diagram = document.querySelector('flow-diagram')!;
  rail.stages = STAGES;
  diagram.config = MAIN_DIAGRAM;

  let cur = -1;

  /* URL hash <-> stage. Each stage gets a slug (from its `short` name) so the
     current stage survives a refresh and is shareable/bookmarkable. */
  const slug = (s: Stage) => s.short.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  function stageFromHash(): number {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    return STAGES.findIndex(s => slug(s) === h);
  }

  function setStage(i: number): void {
    if (i < 0 || i >= STAGES.length || i === cur) return;
    cur = i;
    rail.current = i;
    diagram.stage = STAGES[i];
    location.hash = slug(STAGES[i]);
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
})();
