
import './polyfill.js';
import './buttons.js';
import './input.js';
import './options.js';
import './selection.js';
import './page.js';
import './adverts.js';
import './sw.js';
import './offline.js';
import './placeholders.js';
import './loader.js';

// global error handler for logs
window.onerror = (msg, file, line, col, error) => {
  console.info('got err', String(msg));
  try {
    ga('send', 'event', 'error', `${file},${line}:${col}`, String(msg), {nonInteraction: true});
  } catch (e) {}
};
