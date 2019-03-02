
import * as modifier from './lib/modifier.js';
import * as word from './lib/word.js';
import * as advancedInput from '../node_modules/advanced-input/index.js';

const upgraded = new WeakMap();

export function cursorPosition(el) {
  const controller = upgraded.get(el);
  if (controller === undefined) {
    throw new Error('invalid controller');
  }
  return controller.cursor().x;
}

// word focus handler
function upgrade(inputElement, renderElement) {
  const controller = advancedInput.upgrade(inputElement, renderElement);
  upgraded.set(inputElement, controller);

  let highlight = null;
  let retainedHighlight = false;
  let suggestEmoji = null;

  const refreshCopy = () => {
    let copy = inputElement.value;

    if (inputElement.selectionStart !== inputElement.selectionEnd) {
      copy = copy.substring(inputElement.selectionStart, inputElement.selectionEnd);
    } else if (suggestEmoji && highlight && copy.substring(highlight.end).trim() === '') {
      copy = copy.substring(0, highlight.start) + suggestEmoji;
    }

    inputElement.dataset['copy'] = copy;
  };

  const normalizeState = (valueChange) => {
    const emptySelection = (inputElement.selectionStart === inputElement.selectionEnd);
    retainedHighlight = false;

    let prefix = false;
    if (emptySelection) {
      const {from, to} = word.match(inputElement.value, inputElement.selectionStart);
      if (from < to) {
        highlight = {start: from, end: to};
        controller.mark('highlight', highlight);  // enforce highlight
        prefix = true;
      } else {
        // Don't reset previous highlight unless a new valid one appears. This allows the highlight
        // emoji to continue being modified after it was entered. "Escape" clears this, below.
        // Note that this does NOT call `controller.mark`, just let its internal cleanup fix us.
        retainedHighlight = (highlight !== null);
      }
    } else {
      highlight = null;
      controller.mark('highlight', null);
    }

    const range = highlight || {start: inputElement.selectionStart, end: inputElement.selectionEnd};
    const text = inputElement.value.substring(range.start, range.end);

    if (valueChange) {
      refreshCopy();
      inputElement.dispatchEvent(new CustomEvent('value', {detail: inputElement.value}));
    }

    const detail = {
      text,
      prefix,
      selection: !emptySelection,
    };
    inputElement.dispatchEvent(new CustomEvent('query', {detail}));
  };

  inputElement.addEventListener(advancedInput.event.select, (ev) => normalizeState(ev.detail.change));
  inputElement.addEventListener(advancedInput.event.space, (ev) => {
    if (inputElement.selectionStart !== inputElement.selectionEnd) {
      // ignore
    } else if (inputElement.value.substring(inputElement.selectionEnd).trim() !== '') {
      // ignore, autocomplete isn't being shown anyway
    } else if (suggestEmoji) {
      enactChange((prev) => suggestEmoji);
      ga('send', 'event', 'options', 'typing');
      ev.preventDefault();
    } else {
      // previously, we used to hold this and insert the next autosuggest
    }
  });
  inputElement.addEventListener('keydown', (ev) => {
    switch (ev.key) {
    case 'Escape':
      if (!retainedHighlight) {
        return;
      }
      controller.mark('highlight');
      highlight = null;
      retainedHighlight = false;
      ev.preventDefault();
      break;

    case 'ArrowUp':
    case 'Up':
      document.scrollingElement.scrollTop = 0;
      // fall-through

    case 'ArrowDown':
    case 'Down':
      ev.preventDefault();  // disable normal up/down behavior to scroll
      return;

    default:
      return;
    }

    normalizeState(false);
  });

  const enactChange = (fn) => {
    const range = highlight || {start: inputElement.selectionStart, end: inputElement.selectionEnd};

    const prev = inputElement.value.substring(range.start, range.end);
    const update = fn(prev);
    if (update == null) {  // null or undefined
      return false;
    }

    const emptySelection = (inputElement.selectionStart === inputElement.selectionEnd);
    controller.replace(update, highlight);

    const updatedRange = update.length ? {start: range.start, end: range.start + update.length} : null;
    if (highlight || emptySelection) {
      // advanced-input handles selection, but does not update highlight for us, so replace it
      // if that's where were being updated
      highlight = updatedRange;
      controller.mark('highlight', highlight);
    } else if (updatedRange) {
      controller.select(updatedRange);
    }
    return true;
  };

  // apply tone or gender modifier
  inputElement.addEventListener('modifier', (ev) => {
    const {type, code} = ev.detail;
    enactChange((prev) => modifier.modify(prev, {[type]: code}).out);
  });

  // handle 'emoji' event: if there's a current focus word, then replace it with the new emoji \o/
  inputElement.addEventListener('emoji', (ev) => {
    const emoji = ev.detail.choice;
    enactChange((prev) => emoji);
  });

  // display suggestion
  inputElement.addEventListener('suggest', (ev) => {
    let change = false;

    if (ev.detail) {
      const {name, emoji} = ev.detail;
      controller.suggest = `${name[0] === '^' ? '' : name}\u200b${emoji}`;
      change = (suggestEmoji === emoji);
      suggestEmoji = emoji;
    } else {
      controller.suggest = null;
      change = (suggestEmoji === null);
      suggestEmoji = null;
    }

    change && refreshCopy();
  });
}

upgrade(typer, render);
