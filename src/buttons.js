
/**
 * @fileoverview Handles the buttons in the top-right of the page (currently just Copy).
 */

import * as eventlib from './lib/event.js';
import * as copier from './lib/copier.js';
import {iframeAnnounce} from './lib/announce.js';

const all = Array.from(input.querySelectorAll('button'));

const handler = (ev) => {
  const text = ev.detail.trim();
  const hasValue = Boolean(text);
  all.forEach((button) => button.disabled = !hasValue);
};
typer.addEventListener('value', handler);
handler({detail: typer.value});

const buttonTextShow = 500;

// copy handler
(function(button, input) {
  let timeout;
  const defaultText = button.textContent;
  const spaceRe = /\s*/;

  const copy = () => {
    const text = input.dataset['copy'].trim().replace(/\s+/, ' ');
    if (!copier.copyText(text)) {
      console.warn('could not copy', text)
      return true;
    }
    console.info('copied', text);

    // analytics
    ga('send', 'event', 'text', 'copy');

    // show 'Copied!' message
    button.textContent = button.dataset['copied'];
    button.classList.add('copied');
    window.clearTimeout(timeout);
    timeout = window.setTimeout((ev) => {
      button.textContent = defaultText;
      button.classList.remove('copied');
      maybeReleaseInputEnter();
      iframeAnnounce('copy');
    }, buttonTextShow);
  };

  let wasInputEnter = false;
  input.addEventListener('keydown', (ev) => {
    if (wasInputEnter) {
      // do nothing, enter is being _held_
    } else if (ev.key === 'Enter' && !ev.repeat) {
      button.click();
      button.focus();
      wasInputEnter = true;
      ev.preventDefault();
    }
  });
  document.body.addEventListener('keyup', (ev) => {
    if (ev.key === 'Enter') {
      maybeReleaseInputEnter();
    }
  });
  button.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (wasInputEnter || ev.repeat) {
      return;  // click is generated as the user holds enter
    }
    copy();
    if (eventlib.isKeyboardClick(ev)) {
      // if the user tabbed here, keep focus
      button.focus();
    }
  });

  function maybeReleaseInputEnter() {
    if (wasInputEnter) {
      if (document.activeElement === button) {
        input.focus();  // maybe focus moved
      }
      wasInputEnter = false;
    }
  }

}(copy, typer));

