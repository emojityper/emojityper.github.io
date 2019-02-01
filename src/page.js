
/**
 * @fileoverview Controls the size and `has-value` class of the body itself based on current input.
 */

import * as promises from './lib/promises.js';

const value = (ev) => {
  const text = ev.detail.trim();
  document.body.classList.toggle('has-value', Boolean(text));
};
typer.addEventListener('value', value);
value({detail: typer.value});

// global return-to-typer
document.body.addEventListener('keydown', (ev) => {
  switch (ev.key) {
  case 'Escape':
    // #1: focus on typer
    if (document.activeElement !== typer) {
      typer.focus();
      break;
    }

    // #2: clear selection
    if (typer.selectionStart !== typer.selectionEnd) {
      if (typer.selectionDirection === 'backward') {
        typer.selectionStart = typer.selectionEnd;
      } else {
        typer.selectionEnd = typer.selectionStart;
      }
      break;
    }

    // #3: move to end of input
    const l = typer.value.length;
    typer.setSelectionRange(l, l);
    break;
  }
});

function isExtentNode(node) {
  return node instanceof Element && node.classList.contains('extent');
}

document.addEventListener('selectionchange', (ev) => {
  const s = window.getSelection();
  const {anchorNode: a, focusNode: b} = s;
  if (a !== b && isExtentNode(a) && isExtentNode(b)) {
    s.removeAllRanges();  // remove immediately to prevent flash
    typer.focus();
    typer.dispatchEvent(new CustomEvent('select-all'));
  }
}, true);

document.addEventListener('focusin', (ev) => {
  promises.microtask().then(() => {
    if (document.activeElement === document.body) {
      typer.focus();
    }
  });
});

// set minHeight to actual viewport height, but allow for keyboard etc
const resize = (ev) => {
  const height = window.innerHeight;
  document.body.style.minHeight = `${height}px`;
};
window.addEventListener('resize', resize);
window.addEventListener('load', resize);
resize();

// Link tracking

document.body.addEventListener('click', (ev) => {
  const target = ev.target && ev.target.closest('a[href]');
  if (!target) { return; }

  ga('send', 'event', 'outbound', 'click', target.href);
});
