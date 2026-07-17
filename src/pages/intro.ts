import { html, render } from 'lit';
import '../components/page-scaffold';
import { PAGE } from '../content/intro';

render(html`<page-scaffold .page=${PAGE}></page-scaffold>`, document.getElementById('app')!);
