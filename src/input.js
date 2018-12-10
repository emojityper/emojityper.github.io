
import * as modifier from './lib/modifier.js';
import * as word from './lib/word.js';

function datasetSafeDelete(el, ...keys) {
  const d = el.dataset;
  keys.forEach((key) => {
    if (key in d) {
      delete d[key];
    }
  });
}

const upgraded = new WeakMap();

export function cursorPosition(el) {
  const fn = upgraded.get(el);
  if (fn !== undefined) {
    return fn();
  }
  return undefined;
}

// word focus handler
function upgrade(el) {
  if (upgraded.has(el)) {
    return false;
  }

  // stores the faux-selection shown (different from actual selection in 'state')
  const sel = {
    from: el.selectionStart,
    to: el.selectionEnd,
  };

  const helper = document.createElement('div');
  helper.className = 'overflow-helper';
  el.parentNode.insertBefore(helper, el);

  const underline = document.createElement('div');
  underline.className = 'underline';
  helper.appendChild(underline);

  let suggest = null;
  const autocomplete = document.createElement('div');
  autocomplete.className = 'autocomplete sizer';
  helper.appendChild(autocomplete);

  // measures the width of text
  const measureText = (function() {
    const sizer = document.createElement('div');
    sizer.className = 'sizer';
    helper.appendChild(sizer);

    const nonce = document.createElement('div');
    nonce.className = 'nonce';

    return (text) => {
      sizer.textContent = text;
      sizer.appendChild(nonce);
      return nonce.offsetLeft;
    }
  }());

  // record upgraded measurer for callers to find our pixel position
  upgraded.set(el, () => {
    const mid = ~~((el.selectionStart + el.selectionEnd) / 2)
    return measureText(el.value.substr(0, mid)) - el.scrollLeft;
  });

  // hide underline until load: the font used might not be ready, so it's probably out of whack
  if (document.readyState !== 'complete') {
    underline.classList.add('loading');
    window.addEventListener('load', (ev) => {
      renderLine();
      underline.classList.remove('loading');
    });
  }

  const renderLine = () => {
    if (sel.from >= sel.to) {
      underline.hidden = true;
      return false;
    }
    const {from, to} = sel;

    // otherwise, record and draw the line
    const left = measureText(el.value.substr(0, from));
    const width = measureText(el.value.substr(from, to - from));

    if (width < 0 && !document.getElementById('less')) {
      // nb. this seems to happen in dev with lesscss
      console.warn('invalid sizer width', width, 'for text', sizer.textContent);
    }

    underline.hidden = width <= 0;
    underline.style.left = left + 'px';
    underline.style.width = width + 'px';
    underline.style.transform = `translateX(${-el.scrollLeft}px)`;

    // TODO(samthor): put in div with underline so alignment is free?
    autocomplete.style.transform = `translateX(${-el.scrollLeft + left + width}px)`;
  };

  // force selection
  const setRange = (from, to) => {
    sel.from = from;
    sel.to = Math.max(from, to);
    if (from >= to) {
      datasetSafeDelete(el, 'prefix', 'word', 'focus');
      underline.hidden = true;
      return false;
    }
    el.dataset['focus'] = el.value.substr(from, to - from);
    renderLine();
    return true;
  };

  // rerender autocomplete word if valid
  const renderAutocomplete = () => {
    const s = el.dataset['prefix'] || '';
    const valid = suggest !== null &&
        s.length !== 0 &&
        (suggest.name[0] === '^' || suggest.name.substr(0, s.length) === s) &&
        el.value.substr(sel.to).trim().length === 0;
    if (!valid) {
      autocomplete.textContent = '';
      return false;
    }
    const display = (suggest.name[0] === '^' ? '' : suggest.name.substr(s.length)) + suggest.emoji;
    autocomplete.textContent = display;
    return true;
  };

  // state/handler keep track of the current focus word (plus scroll position, if input is big)
  const initialLength = el.value.length;
  const state = {start: initialLength, end: initialLength, value: undefined};
  const changeHandler = (permitNextChange) => {
    if (permitNextChange !== false &&
        el.selectionStart === state.start &&
        el.selectionEnd === state.end &&
        el.value === state.value) {
      return true;  // already at this state
    }
    [state.start, state.end] = [el.selectionStart, el.selectionEnd];
    if (state.value !== el.value) {
      el.dispatchEvent(new CustomEvent('value', {detail: el.value}));
      state.value = el.value;
    }

    // we're pretending to be the user's selection
    if (state.start !== state.end) {
      datasetSafeDelete(el, 'prefix', 'word');

      setRange(state.start, state.end);

      underline.classList.add('range');
      el.classList.add('range');
      return false;
    }
    underline.classList.remove('range');
    el.classList.remove('range');

    // if it's invalid and we were permitted (this is used for faux-highlights), ignore
    const {from, to} = word.match(el.value, state.start);
    if (from >= to && permitNextChange) {
      return false;  // we just got an emoji, retain implicit selection until next change
    }
    if (setRange(from, to)) {
      // if the range was valid, update the prefix/focus but delete the word (in typing state)
      el.dataset['focus'] = el.dataset['prefix'] = el.value.substr(from, to - from).toLowerCase();
      datasetSafeDelete(el, 'word');
    }
    return false;
  };

  // runs change handler and emits the 'word' event as appropriate
  let previousDetail = {};
  let heldScrollLeft = 0;
  const mergedEventHandler = (events, permitNextChange) => {
    if (events.has('select-all')) {
      // custom event generated by page.js
      el.setSelectionRange(0, el.value.length);
    } else if (events.has('select-end')) {
      // custom event generated by options.js
      el.setSelectionRange(el.value.length, el.value.length);
    } else if (events.has('focus') && !(events.has('mousedown') || events.has('touchstart'))) {
      // if there was a focus event, don't let the browser take over: reset previous known good
      // ... unless the user used their mouse/cursor to select something
      // TODO: this sets on initial load, even though it probably doesn't need to
      el.setSelectionRange(state.start, state.end);
    }

    // some browsers set this to zero when we leave, restore it
    if (events.has('blur') || events.has('focus')) {
      // TODO(samthor): Safari flashes L/R on this. We probably don't care.
      el.scrollLeft = heldScrollLeft;
    }
    heldScrollLeft = el.scrollLeft;

    // run change handler: if true, nothing changed
    // (nb. the logic before return is because autocompletes don't count for alreadyAtState)
    const alreadyAtState = changeHandler(permitNextChange);

    // clear suggestion if we tried to render it and it wasn't valid
    if (!renderAutocomplete()) {
      suggest = null;
    }

    // set dataset['copy'] to the value you'd copy if you hit enter right now
    // TODO(samthor): Generate this only when we run a copy?
    if (el.selectionStart !== el.selectionEnd) {
      el.dataset['copy'] = el.value.substr(el.selectionStart, el.selectionEnd - el.selectionStart);
    } else if (suggest !== null) {
      el.dataset['copy'] = el.value.substr(0, sel.from) + el.value.substr(sel.to) + suggest.emoji;
    } else {
      el.dataset['copy'] = el.value;
    }

    // if nothing changed, don't trigger any option callbacks
    if (alreadyAtState) { return; }

    // send query: prefix or whole-word (unless nothing is focused)
    const text = el.dataset['focus'] ? el.dataset['prefix'] || el.dataset['word'] || null : '';
    const detail = {
      text,
      prefix: 'prefix' in el.dataset,
      focus: el.dataset['focus'],
      selection: (el.selectionStart !== el.selectionEnd),
    };

    // send event only if something has changed
    if (detail.text !== previousDetail.text ||
        detail.prefix !== previousDetail.prefix ||
        detail.focus !== previousDetail.focus ||
        detail.selection !== previousDetail.selection) {
      previousDetail = detail;
      el.dispatchEvent(new CustomEvent('query', {detail}));
    }
  };

  // whether user typed space and nothing came out
  let hasPendingSpace = false;

  // dedup listeners on a rAF
  let permitNextChange;  // FIXME: global-ish scope is ugly
  (function() {
    let frame;
    let events = new Set();  // records the events that occured to cause this
    const dedup = (ev) => {
      if (!frame) {
        permitNextChange = undefined;
        events.clear();
        frame = window.requestAnimationFrame(() => {
          frame = null;
          mergedEventHandler(events, permitNextChange);
        });
      }
      ev && events.add(ev.type);
    };

    // lots of listeners for a million different change reasons
    const rest = 'change keydown keypress focus click mousedown touchstart select input select-all select-end blur';
    rest.split(/\s+/).forEach((event) => el.addEventListener(event, dedup));
    dedup();

    // handle 'suggest' event: show default autocomplete option
    el.addEventListener('suggest', (ev) => {
      suggest = ev.detail;
      if (hasPendingSpace) {
        maybeReplace();
      }
      dedup();
    });

    // if a user is dragging around, this might be changing the offsetLeft (dragging input l/r)
    el.addEventListener('mousemove', (ev) => {
      if (ev.which) {
        dedup();
      }
    });

    // add 'selectionchange' (only valid on document) to listen to the initial long-press selection
    // on Chrome (possibly others?) mobile: it doesn't generate 'select'.
    document.addEventListener('selectionchange', (ev) => {
      if (document.activeElement === el) {
        dedup();
      }
    });
  }());

  function maybeReplace(expectSpace = false) {
    if (el.selectionEnd < sel.to) {
      // this was before the end of the selection, don't autocomplete
      return false;
    }

    const text = el.dataset['prefix'] || '';
    if (text.length === 0 || !suggest || !suggest.name.startsWith(text)) {
      // no valid sugestion or no text anyway
      return false;
    }

    const rest = el.value.substr(sel.to);
    const mustBeSpace = rest.substr(0, el.selectionStart - sel.to);
    const trimmed = mustBeSpace.trim();
    if (trimmed.length !== 0) {
      // this wasn't blank or space chars
      return false;
    } else if (expectSpace && !mustBeSpace.length) {
      // there wasn't a space and we expected one
      return false;
    }

    if (rest.trim().length !== 0 && suggest.name !== text) {
      // we're not the end of the string, so only autocomplete if it's entirely typed
      return false;
    }

    // dispatch change request on ourselves
    ga('send', 'event', 'options', 'typing');
    const detail = {
      choice: suggest.emoji,
      word: suggest.name,
    };
    typer.dispatchEvent(new CustomEvent('emoji', {detail}));
    return true;
  }

  // add a non-deduped keydown handler, to run before others and intercept space
  el.addEventListener('keydown', (ev) => {
    hasPendingSpace = false;
    switch (ev.key) {
    case 'Escape':
      permitNextChange = false;  // force next change
      break;

    case 'ArrowDown':
    case 'Down':
    case 'ArrowUp':
    case 'Up':
      ev.preventDefault();  // disable normal up/down behavior to change focus
      return;

    case ' ':
      const success = maybeReplace();
      if (ev.shiftKey) {
        ev.preventDefault();  // don't type space if shift held
      }
      if (!success) {
        // hold this for when autocompletes arrive
        hasPendingSpace = true;
      }
      break;
    }
  });

  // add a non-deduped keyup handler, for space on mobile browsers ('dreaded keycode 229')
  el.addEventListener('keyup', (ev) => {
    // was it a 229 or no code, and was the typed character a space?
    if (ev.keyCode === 229 || !ev.keyCode) {
      // TODO: possibly record hasPendingSpace for future arriving suggestions
      maybeReplace(true);
    }
  });

  // dedup re-rendering calls
  (function() {
    let frame;
    const dedupRenderLine = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(() => {
          frame = null;
          renderLine();
        });
      }
    };
    window.addEventListener('resize', dedupRenderLine);
    el.addEventListener('wheel', dedupRenderLine, {passive: true});
  }());

  // replace helper
  const replaceFocus = (call) => {
    const previousScrollLeft = el.scrollLeft;
    const {from, to} = sel;
    const value = el.value.substr(from, to - from);
    let [start, end] = [typer.selectionStart, typer.selectionEnd];
    const dir = typer.selectionDirection;

    const update = call(value);
    if (update == null) { return false; }

    const prev = document.activeElement;

    // select the region and 'type' it with insertText to provide undo/redo history
    // nb. selecting the typer means that undo will always make us selected; probably fine
    typer.focus();
    typer.selectionStart = from;
    typer.selectionEnd = to;
    const expected = typer.value.substr(0, from) + update + typer.value.substr(to);
    if (!document.execCommand('insertText', false, update) || typer.value !== expected) {
      // set manually: this is fallback / Firefox mode
      typer.value = typer.value.substr(0, from) + update + typer.value.substr(to);
    }
    typer.dispatchEvent(new CustomEvent('change'));  // nb. updates from/to (from won't change)

    const drift = (where) => {
      if (where >= to) {
        // after the update
        where = where - (to - from) + update.length;
      } else if (where > from) {
        // during the update
        where = from + update.length;
      } else {
        // do nothing, was before
      }
      return where;
    };

    // pretend we were like this all along
    [state.start, state.end] = [drift(start), drift(end)];
    typer.setSelectionRange(state.start, state.end, dir);

    // TODO(samthor): Safari refuses to make this focus after the first above.
    prev && prev.focus();

    permitNextChange = true;
    el.scrollLeft = previousScrollLeft;  // before setRange, so the underline is correct
    setRange(from, from + update.length);
    return true;
  };

  // handle 'modifier' event: apply modifiers to the focus emoji, if any
  el.addEventListener('modifier', (ev) => {
    const arg = {[ev.detail.type]: ev.detail.code};
    replaceFocus((value) => modifier.modify(value, arg).out);
  });

  // handle 'emoji' event: if there's a current focus word, then replace it with the new emoji \o/
  el.addEventListener('emoji', (ev) => {
    const emoji = ev.detail.choice;
    if (!replaceFocus(() => emoji)) { return; }

    // listen to the caller's view on what word we should pretend this emoji is
    el.dataset['word'] = ev.detail.word || '';
    datasetSafeDelete(el, 'prefix');
  });
}

upgrade(typer);
