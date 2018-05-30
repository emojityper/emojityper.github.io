
import * as emoji from '../../node_modules/ok-emoji/src/emoji.js';

// TODO(samthor): Just use this on supported browsers.
// const re = new RegExp(/(?:[\p{Letter}\p{Number}])/u);

function letterAt(text, pos) {
  const code = text.charCodeAt(pos);
  const after = text.charCodeAt(pos + 1);

  if (after === emoji.runeVS16) {
    return false;  // VS16 follows
  }

  // return Boolean(re.exec(text.substr(pos, 1)));
  return (code < 5000 && code > 32) || code === 12484;  // shruggie
}

export function match(text, at) {
  let from = at;
  let to = at;

  // are we at the end (only have spaces until end)?
  const isAtEnd = text.substr(at).trim() === '';
  const isNotWordAfter = isAtEnd || !letterAt(text, at);

  if (isNotWordAfter) {
    for (; to > 0; --to) {
      if (text.charCodeAt(to - 1) > 32) {
        break;
      }
    }
    if (to < from) {
      from = to;
    }
  }

  // walk backwards while the previous character is a word
  for (; from > 0; --from) {
    if (!letterAt(text, from - 1)) {
      break;
    }
  }

  // walk forwards while the next char is not a space
  for (; to < text.length; ++to) {
    if (!letterAt(text, to)) {
      break;
    }
  }

  if (from > to) {
    from = to;
  }
  return {from, to};
}