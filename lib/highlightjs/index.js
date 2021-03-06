import { setHTML, addCss, removeCss, waitFor } from '../common/util';

import html from './highlightjs.html';
import css from './highlightjs.css';

export class XHighlightjs extends HTMLElement {
  set value(val) {
    if (!val.trim()) return;

    if (this.prettier) {
      try {
        const parser = this.getParser(this.language);
        this._value = window.prettier.format(val, {parser, plugins: window.prettierPlugins});
      } catch (e) {
        console.error(e);
        this._value = e;
      }
    } else {
      this._value = this.fixIndent(val);
    }


    const viewerEl = this.querySelector('.x-highlight');
    viewerEl.innerHTML = this.language === 'html' ? this._value.replace(/</g, '&lt;') : this.value;
    const viewer = window.hljs.highlightElement(viewerEl);

    this.dispatchEvent(new CustomEvent('load', {
      detail: viewerEl,
      bubbles: true
    }));
  }

  get value() {
    return this._value;
  }

  connectedCallback() {
    addCss(this, css);
    this.prettier = this.getAttribute('prettier') !== null;
    this.language = this.getAttribute('language') || 'javascript';

    const theme = this.getAttribute('theme') || 'monokai';
    const value = this.innerText;
    this.classList.add('parsed'); // to remove "white-space: wrap"

    setHTML(this, html)
      .then(_ => waitFor('hljs'))
      .then(_ => this.prettier ? waitFor('prettier') : Promise.resolve())
      .then(_ => {
        this.querySelector('link').setAttribute('href', 
          `//unpkg.com/@highlightjs/cdn-assets/styles/${theme}.min.css`);
        this.value = value;
      });
  }

  disconnectedCallback() {
    removeCss(this);
  }

  fixIndent(code) {
    code = code.replace(/^([ \t]*\n+){1,}|[\n\t ]+$/g, ''); // remove empty first/last line
    const firstIndent = (code.match(/^([ ]+)/) || [])[1];
    if (firstIndent) {
      const re = new RegExp(`^${firstIndent}`, 'gm');
      return code.replace(re, '');
    }
    return code;
  }

  getParser(search) {
    const prettierParsers  = {
      css: ['css', 'postcss', 'scss', 'sass'],
      html: ['xml', 'xhtml', 'html5', 'html'], 
      babel: ['js', 'javascript', 'es5', 'es6', 'es7'], 
      angular: ['angular', 'ng'], 
      markdown: ['markdown', 'md'], 
      typescript: ['typescript', 'ts'], 
      yaml: ['yaml'],
      'json-stringify': ['json']
    };
    const entry = Object.entries(prettierParsers)
      .find( ([key, value]) => value.indexOf(search) !== -1 );
    return entry?.[0] || 'babel';
  }

}

if (!customElements.get('x-highlightjs')) {
  customElements.define('x-highlightjs', XHighlightjs);
}
