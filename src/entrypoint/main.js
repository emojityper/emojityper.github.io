
/**
 * @fileoverview Initial payload entrypoint.
 */

import '../polyfill.js';
import '../loader.js';  // first, as this adds ga()

import '../buttons.js';
import '../input.js';
import '../options.js';
import '../page.js';
import '../sw.js';

// global error handler for logs
window.onerror = (msg, file, line, col, error) => {
  console.info('got err', String(msg));
  try {
    ga('send', 'event', 'error', `${file},${line}:${col}`, String(msg), {nonInteraction: true});
  } catch (e) {}
};
