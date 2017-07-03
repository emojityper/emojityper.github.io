const api = 'https://us-central1-emojityper.cloudfunctions.net';

import build from './prefixgen.js';
import * as results from './results.js';

/**
 * Returns the local prefix search tool.
 *
 * @return {function(string, boolean): !Array<!Array<string>>}
 */
const getPrefixGen = (function() {
  let localPromise = null;  // results from localStorage
  const raw = window.localStorage['popular'];
  if (raw) {
    let out;
    try {
      out = JSON.parse(raw);
    } catch (e) {
      console.debug('couldn\'t parse localStorage popular', e);
      out = null;
    }
    if (out) {
      localPromise = Promise.resolve(build(out['results']));
      if (out['created'] >= (+new Date - 60 * 60 * 24 * 1000)) {
        // return immediately, it's less than one day old
        return () => localPromise;
      }
    }
  }

  // we don't have data or it's >1day old, refetch
  const f = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', api + '/popular');
    xhr.onerror = reject;
    xhr.responseType = 'json';
    xhr.onload = () => resolve(xhr.response);
    xhr.send();
  }).then(raw => {
    // IE11 doesn't respect responseType, and we always return an Object
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  });

  f.then(data => {
    // TODO: It's a bit ugly to hit the loader from here.
    window.loader.hidden = true;
    data['created'] = +new Date();
    window.localStorage['popular'] = JSON.stringify(data);
  });

  const remotePromise = f.then(v => build(v['results']));
  if (!localPromise) {
    // TODO: It's a bit ugly to hit the loader from here.
    window.loader.hidden = false;
    return () => remotePromise;  // wait for data
  }

  // return localPromise until remotePromise is done
  let promiseToReturn = localPromise;
  remotePromise.then(() => promiseToReturn = remotePromise);
  return () => promiseToReturn;
}());

// shared state set via callback() and used in request()
const zeroCallback = function() {};
let requestCallback = zeroCallback;

/**
 * Requests emoji completion. Initial emoji will be returned via this Promise, as well as the
 * callback set through callback().
 *
 * @param {string} text user has typed
 * @param {boolean} prefix is this a prefix search, or is it a definite whole word?
 * @return {!Promise<!Array<!Array>>}
 */
export const request = (function() {
  let timeout;  // timeout handler for secondary query

  return async function request(text, prefix) {
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    window.clearTimeout(timeout);

    if (!text) {
      requestCallback([]);
      return;
    }
    let indexedResults = null;

    // TODO: only send extra query if there's not enough results, or the user hits 'more'
    const localTimeout = window.setTimeout(_ => {
      let url = api + '/query?query=' + encodeURIComponent(text);
      if (prefix) {
        url += '&prefix=true';
      }
      window.fetch(url)
          .then(out => out.json())
          .then(out => {
            // TODO: store this request locally probably
            const sending = indexedResults || [];
            results.merge(sending, out['results']);
            return sending;
          })
          .then(r => send(r));
    }, 2000);
    timeout = localTimeout;

    function send(out) {
      if (timeout === localTimeout) {
        requestCallback(out);
      }
    }

    const suggest = await getPrefixGen();
    indexedResults = suggest(text, prefix);
    send(indexedResults.slice());
  }
}());

/**
 * Sets the callback for search requests, or null to clear.
 *
 * @param {?function(!Array<!Array>): undefined} callback
 */
export function callback(callback) {
  requestCallback = callback || zeroCallback;
}

/**
 * Records use of name/emoji pairs.
 *
 * @param {string} name used to select emoji
 * @param {string} emoji selected
 * @param {!Promise<!Response>} eventual response after delay
 */
export const select = (function() {
  const delay = 5 * 1000;
  let pending = {};
  let timeout;
  let currentPromise;
  let eventualResolve;

  const runner = () => {
    const body = JSON.stringify(pending);
    pending = {};  // clear pending for next time

    // TODO: use sendBeacon
    const p = window.fetch(api + '/select', {method: 'POST', body})
    if (!eventualResolve) {
      throw new Error('got fetch without eventualResolve');
    }
    currentPromise = null;  // success... probably
    eventualResolve(p);
  };

  return function select(name, emoji) {
    pending[name] = emoji;

    if (!currentPromise) {
      // save resolve for later
      currentPromise = new Promise((resolve) => eventualResolve = resolve);
    }

    window.clearTimeout(timeout);
    timeout = window.setTimeout(runner, delay);
    return currentPromise;
  }
}());

/**
 * Submit the name of an emoji.
 *
 * @param {string} name
 * @param {string} emoji
 * @return {!Promise<Response>}
 */
export function submit(name, emoji) {
  const body = new FormData();
  body.append('name', name);
  body.append('emoji', emoji);
  return window.fetch(api + '/name', {method: 'POST', mode: 'cors', body});
}
