import { mountPage } from '../page';
import { MAIN_DIAGRAM, STAGES } from '../content/insight-inference';

const diagram = document.querySelector('flow-diagram')!;
diagram.content = { config: MAIN_DIAGRAM, stage: STAGES[0] };

mountPage(diagram, STAGES);
