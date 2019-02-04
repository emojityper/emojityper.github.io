
/**
 * @fileoverview Emojityper's suggestion handler. Handles creation, showing etc of autocomplete
 * buttons in the UI.
 */

import * as provider from './lib/provider.js';
import * as modifier from './lib/modifier.js';
import {valid, findValidMatch} from './lib/valid.js';
import * as promises from './lib/promises.js';
import * as eventlib from './lib/event.js';
import * as input from './input.js';
import * as copier from './lib/copier.js';
import {minimalHeight} from './lib/const.js';

/**
 * ButtonManager helps create and show emoji buttons in the UI.
 */
class ButtonManager {
  constructor(holder) {
    this.holder_ = holder;

    /** @type {!Map<string, !HTMLElement>} */
    this.options_ = new Map();

    /** @type {!Map<string, !HTMLButtonElement>} */
    this.buttons_ = new Map();

    /** @type {!WeakMap<!HTMLButtonElement, !DocumentFragment>} */
    this.buttonTarget_ = new WeakMap();

    /** @type {!Array<!HTMLButtonElement} */
    this.buttonPool_ = [];

    window.requestIdleCallback(() => {
      for (let i = 0; i < 10; ++i) {
        this.buttonPool_.push(document.createElement('button'));
      }
    });

    const modifierHolder = document.createElement('div');
    this.holder_.appendChild(modifierHolder);

    /** @type {function(this:ButtonManager, !Object): void} */
    this.setModifier = (() => {
      const genderOption = ButtonManager.optionType_('modifier', 'gender');
      const toneOption = ButtonManager.optionType_('modifier', 'tone');
      modifierHolder.appendChild(genderOption);
      modifierHolder.appendChild(toneOption);

      // helper to create buttons
      const createModifierButton = (text, value=null) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.dataset['value'] = value;
        return button;
      };

      // create gender options
      const genders = [
        createModifierButton('\u{26AC}', ''),
        createModifierButton('\u{2640}', 'f'),
        createModifierButton('\u{2640}\u{2642}', 'fm'),
        createModifierButton('\u{2642}', 'm'),
        createModifierButton('\u{2642}\u{2640}', 'mf'),
      ];

      // create tone options
      const tones = [
        createModifierButton('\u{2014}', ''),
      ];
      for (let i = 0x1f3fb; i <= 0x1f3ff; ++i) {
        tones.push(createModifierButton(String.fromCodePoint(i), i));
      }

      // helper to add/remove
      const updateStatus = (yes, node, owner) => {
        yes ? owner.appendChild(node) : node.remove();
      };
      return function(info) {
        const active =
            modifierHolder.contains(document.activeElement) ? document.activeElement : null;
        genders.forEach((node) => {
          const l = node.dataset['value'].length;
          const yes = (!l && info.gender.neutral)
              || (l === 1 && info.gender.single)
              || (l === 2 && info.gender.double);
          updateStatus(yes, node, genderOption);
        });
        tones.forEach((node) => updateStatus(info.tone, node, toneOption));

        // kick the elements: Safari needs this otherwise sometimes they remain hidden (!)
        modifierHolder.insertBefore(genderOption, genderOption.nextSibling);
        modifierHolder.insertBefore(toneOption, toneOption.nextSibling);

        // refocus if one was focused
        active && active.focus();
      }
    })();
  }

  static optionType_(type, value) {
    const node = document.createElement('div');
    node.className = 'options ' + type;
    node.dataset[type] = value;
    node.dataset['name'] = value;
    return node;
  }

  optionForName_(name) {
    const prev = this.options_.get(name);
    if (prev) {
      return prev;
    }
    const node = document.createElement('div');
    node.className = 'options';
    node.setAttribute('data-option', name);

    if (name[0] === '^') {
      node.classList.add('special');
      name = name.substr(1);
    }
    node.setAttribute('data-name', name);  // presentation only
    return node;
  }

  /**
   * Creates a `button` with the textContent of the passed emoji. Starts removed from the page,
   * but will (when valid) be placed in-order inside the specified `option`.
   *
   * @param {!HTMLElement} option to place inside
   * @param {string} emoji
   * @return {!HTMLButtonElement}
   */
  addEmojiTo_(option, emoji) {
    let button = this.buttons_.get(emoji);
    if (button) {
      // if the button was known, check buttonTarget_: either it's the eventual placement, which
      // we must replace, or it's a known good/bad already
      const target = this.buttonTarget_.get(button);
      if (target === null) {
        return button;  // known invalid
      } else if (target === undefined) {
        option.appendChild(button);  // known good
        return button;
      }
    } else {
      button = this.buttonPool_.pop() || document.createElement('button');
      button.textContent = emoji;
      this.buttons_.set(emoji, button);

      valid(emoji).then((isValid) => {
        if (!isValid) {
          return this.buttonTarget_.set(button, null);
        }

        const node = this.buttonTarget_.get(button);
        if (!node) {
          return;  // we were GC'ed before valid returned
        }
        node.parentNode.replaceChild(button, node);
        this.buttonTarget_.delete(button);
      });
    }

    const node = document.createTextNode('');  // empty placeholder to replace
    this.buttonTarget_.set(button, node);
    option.appendChild(node);

    return button;
  }

  /**
   * Updated displayed options with real results. These are expected the API format:
   *    [[name,emoji,emoji,...],[name,emoji,...],...]
   *
   * This retains existing options if they are included in the named results.
   *
   * @param {!Array<!Array<string>>}
   */
  update(results) {
    const options = new Map();
    const buttons = new Map();
    const previousActiveElement =
        this.holder_.contains(document.activeElement) ? document.activeElement : null;

    results.forEach((result) => {
      const name = result[0];
      const special = (name[0] === '^');

      const option = this.optionForName_(name);
      options.set(name, option);
      this.options_.delete(name);
      this.holder_.appendChild(option);  // reinsert in better order

      // TODO(samthor): This is a bit hacky. This saves buttons that are part of these options,
      // even if they haven't been sent to us again in results.
      for (let i = 0; i < option.children.length; ++i) {
        const b = option.children[i];
        const emoji = b.textContent;
        if (special || buttons.has(emoji)) {
          b.remove();
          this.buttonPool_.push(b);
          --i;
          continue;
        }
        buttons.set(emoji, b);
      }

      for (let i = 1, emoji; emoji = result[i]; ++i) {
        if (buttons.has(emoji)) {
          continue;  // already displayed by an option before us
        }
        // nb. addEmojiTo_ pulls old buttons from this.buttons_
        buttons.set(emoji, this.addEmojiTo_(option, emoji));
      }
    });

    // remove now-disused options
    this.options_.forEach((option) => {
      // TODO(samthor): Edge doesn't like ...HTMLCollection
      for (let i = 0; i < option.children.length; ++i) {
        this.buttonPool_.push(option.children[i]);
      }
      option.remove();
    });
    this.options_ = options;
    this.buttons_ = buttons;

    if (previousActiveElement) {
      if (document.body.contains(previousActiveElement)) {
        previousActiveElement.focus();
      } else {
        typer.focus();  // restore to main input
      }
    }
  }
}

// stores the previous user-driven l/r position
let previousChooserLeft = undefined;
let duringNavigate = false;

// if a button was focused, reset chooser unless we were going u/d
chooser.addEventListener('focus', (ev) => {
  if (!duringNavigate) {
    previousChooserLeft = document.activeElement.getBoundingClientRect().left;
  }
}, true);

/**
 * Navigates through candidates until we find the best not on our current row, and focuses it.
 *
 * @param {!IArrayLike<!Node>} cands
 * @return {boolean} true if we focused something new
 */
function navigateChooserButtonVertical(cands) {
  const best = {dist: Infinity, button: null};

  const previousRect = document.activeElement.getBoundingClientRect();
  // did we have a previous explicit l/r position?
  const left = (previousChooserLeft !== undefined ? previousChooserLeft : previousRect.left);

  let targetTop = undefined;
  for (let i = 0; i < cands.length; ++i) {
    const button = cands[i];
    const candidateRect = button.getBoundingClientRect();

    if (previousRect.top === candidateRect.top) { continue; }
    if (targetTop === undefined) {
      targetTop = candidateRect.top;
    } else if (candidateRect.top !== targetTop) {
      break;  // no more good candidates
    }

    const dist = Math.abs(candidateRect.left - left);
    if (dist < best.dist) {
      [best.dist, best.button] = [dist, button];
    }
  }

  if (!best.button) {
    return false;
  }
  duringNavigate = true;
  try {
    best.button.focus();
  } finally {
    duringNavigate = false;
  }
  return true;
}

// button click handler
chooser.addEventListener('click', (ev) => {
  previousChooserLeft = undefined;  // used a mouse or chose something
  const isKeyboard = eventlib.isKeyboardClick(ev);

  let label = undefined;
  const b = ev.target;
  if (b.localName !== 'button') {
    // ignore
  } else if (b.parentNode.dataset['modifier']) {
    if (ev.shiftKey) {
      return;  // don't do anything
    }

    const value = 'value' in b.dataset ? (+b.dataset['value'] || b.dataset['value']) : null;
    const detail = {type: b.parentNode.dataset['modifier'], code: value};
    typer.dispatchEvent(new CustomEvent('modifier', {detail}));
    label = 'modifier';
  } else if (b.parentNode.dataset['option']) {
    if (ev.shiftKey) {
      if (copier.copyText(b.textContent)) {
        ga('send', 'event', 'options', 'copy');
      }

      // retain scroll position while refocusing on the suitable target
      const scrollTop = document.scrollingElement.scrollTop;
      isKeyboard ? b.focus() : typer.focus();
      document.scrollingElement.scrollTop = scrollTop;
      return;
    }

    // this clears the options on choice.
    // TODO: retain all, and show what you typed as a hint autocomplete
    const detail = {choice: b.textContent};
    typer.dispatchEvent(new CustomEvent('emoji', {detail}));
    provider.select(b.parentNode.dataset['option'], detail.choice);
    label = 'emoji';
  } else {
    // unknown
  }
  if (!label) { return; }

  ga('send', 'event', 'options', 'click', label);

  if (!isKeyboard) {
    typer.focus();  // nb. we're actually double-refocusing
  }
});

// handle moving down from input
typer.addEventListener('keydown', (ev) => {
  if (ev.key === 'ArrowDown' || ev.key === 'Down') {
    const typerRect = typer.getBoundingClientRect();
    previousChooserLeft = typerRect.left + input.cursorPosition(typer);

    if (navigateChooserButtonVertical(chooser.querySelectorAll('button'))) {
      ga('send', 'event', 'options', 'keyboardnav');
    }
  } else if (ev.key === 'ArrowRight' || ev.key === 'Right') {
    const l = typer.value.length;
    if (typer.selectionEnd === l && typer.selectionStart === l) {
      const first = chooser.querySelector('button');
      first && first.focus();
    }
  }
});

// handle keyboard navigation inside chooser
chooser.addEventListener('keydown', (ev) => {
  const arrow = eventlib.arrowFromEvent(ev);
  if (!arrow) { return; }

  if (!chooser.contains(document.activeElement)) { return; }

  // TODO: memoize value
  const buttonArray = Array.from(chooser.querySelectorAll('button'));
  const index = buttonArray.indexOf(document.activeElement);
  if (index === -1) { return; }

  // handle l/r keys
  let delta;
  if (arrow === 'ArrowLeft') {
    delta = -1;
  } else if (arrow === 'ArrowRight') {
    delta = +1;
  }
  if (delta) {
    const target = index + delta;
    if (target >= 0 && target < buttonArray.length) {
      buttonArray[target].focus();
    } else if (target < 0) {
      typer.focus();
      typer.dispatchEvent(new CustomEvent('select-end'));
    }
    return;  // done
  }

  // handle u/d keys
  let cands;
  if (arrow === 'ArrowUp') {
    cands = buttonArray.slice(0, index);
    cands.reverse();
  } else if (arrow === 'ArrowDown') {
    cands = buttonArray.slice(index);
  } else {
    return;
  }

  if (!navigateChooserButtonVertical(cands)) {
    if (arrow === 'ArrowUp') {
      typer.focus();
    }
  }
  if (arrow === 'ArrowDown') {
    // don't allow arrow scrolling unless we're within 64 pixels of the screen end
    const focusRect = document.activeElement.getBoundingClientRect();
    const max = focusRect.top + focusRect.height;
    if (window.innerHeight - max > 64) {
      ev.preventDefault();
    }
  }
});

(function() {
  const longTime = 2000;
  const delayTime = 250;
  const manager = new ButtonManager(chooser);

  let previous = {};
  let previousQueryAt = performance.now();
  let previousResults = [];

  let suggestInvoke = 0;
  function findSuggest(q) {
    const localSuggestInvoke = ++suggestInvoke;
    if (!q) {
      typer.dispatchEvent(new CustomEvent('suggest', {detail: null}));
      return;
    }

    let exactMatch = null;
    const localResults = previousResults.slice().filter((row) => {
      if (q.length > 1 && row[0] === q) {
        exactMatch = row;
        return false;
      }
      return row[0].startsWith(q) || row[0][0] === '^';
    });
    exactMatch && localResults.unshift(exactMatch);

    const callback = (result) => {
      if (localSuggestInvoke === suggestInvoke) {
        typer.dispatchEvent(new CustomEvent('suggest', {detail: result}));
      }
    };
    findValidMatch(localResults, callback);
  }

  // handler for a prefix search
  typer.addEventListener('query', (ev) => {
    const query = ev.detail;
    const now = performance.now();

    // immediately inform manager of modifier buttons (gender, tone), if it's a full word search
    const info = modifier.modify(!ev.detail.prefix && ev.detail.focus || '');
    manager.setModifier(info);

    if (previous.text !== query.text) {
      // text changed, immediately run suggest code
      findSuggest(query.text);
    }

    // TODO(samthor): This delays further requests. Ideally we want to 'subscribe' to a topic
    // from the provider and just be fed updates as fast as we have them (including if we have
    // a local cache). This way we avoid awkward delays and filtering oddities.
    const initialMore = previous.text && query.text && previous.text.length !== 0 &&
        previous.text.startsWith(query.text.substr(0, previous.text.length)) || false;

    let immediate = false;
    if (!previous.text || previous.prefix !== query.prefix) {
      immediate = true;  // type changed, user expects snappiness
    } else if (now - previousQueryAt > longTime) {
      immediate = true;  // it's been a while
    }
    previous = query;
    previousQueryAt = now;

    const request = async (timeout=0, more=false) => {
      if (timeout) {
        await promises.rAF(timeout);
        if (previous !== query) { return -1; }
      }
      const results = await provider.request(query.text, query.prefix, more);
      if (previous !== query) { return -1; }

      // find the first matching thing and suggest it as autocomplete
      previousResults = results;
      findSuggest(query.text);

      return manager.update(results);
    };

    const p = request(immediate ? 0 : delayTime, initialMore).then((valid) => {
      if (valid < 0) { return -2; }  // query changed

      if (!query.text) {
        // TODO: delay empty data by a decent time, except on small screens
        const timeout = window.innerHeight <= minimalHeight ? 125 : 750;
        return request(timeout, true);
      }

      const timeout = Math.max(1000, 100 * Math.pow(valid, 0.75));
      return request(timeout, true);
    }).catch((err) => {
      console.error('error doing request', err);
    });
  });
}());
