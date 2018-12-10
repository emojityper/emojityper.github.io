const api = 'https://emojibuff.appspot.com/api';
const recentLimit = 16;
const selectionDelay = 5 * 1000;

import build from './prefixgen.js';
import * as promises from './promises.js';
import * as results from './results.js';
import type from './type.js';

/**
 * @param {string} key for endpoint/cache
 * @param {number} expiry in hours
 * @param {(function(boolean): void)=} callback to call with true then false (for loading work)
 * @return {function(): !Promise<!Array<!Array<string>>}
 */
function loaderFor(key, expiry=24, callback=() => {}) {
  let promiseResults;

  // TODO: refetch after >expiry, don't just invalidate

  const raw = window.localStorage[key];
  if (raw) {
    let out;
    try {
      out = JSON.parse(raw);
    } catch (e) {
      console.debug('couldn\'t parse localStorage', key, e);
      out = null;
    }
    if (out && out['results']) {
      promiseResults = Promise.resolve(out['results']);
      if (out['created'] >= +new Date - (60 * 60 * 1000 * expiry)) {
        // return immediately, it's less than one day old
        return () => promiseResults;
      }
    }
  }

  // we don't have data or it's >1day old, refetch
  // TODO(samthor): Break into retryable fetch.
  const f = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${api}/${key}`);
    xhr.onerror = reject;
    xhr.responseType = 'json';
    xhr.onload = () => resolve(xhr.response);
    xhr.send();
  }).then((raw) => {
    // IE11 doesn't respect responseType, and we always return an Object
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }).then((update) => {
    promiseResults = f;  // can return real results now

    // store in localStorage for next time
    update['created'] = +new Date();
    window.localStorage[key] = JSON.stringify(update);

    // return updated results
    return update['results'];
  });

  // no local data, wait for data
  if (!promiseResults) {
    callback(true);                 // indicate working
    f.then(() => callback(false));  // done
    return () => f;
  }

  return () => promiseResults;
}

/**
 * Returns the local prefix search tool.
 *
 * @return {!Promise<function(string, boolean): !Array<!Array<string>>>}
 */
const getPrefixGen = (function() {
  const loader = loaderFor('popular', 24, (working) => {
    // TODO: It's a bit ugly to hit the loader from here.
    window.loader.hidden = !working;
  });
  return () => {
    return loader().then((results) => build(results))
  };
}());

/**
 * Returns the trending emoji.
 *
 * @return {!Promise<!Array<string>>}
 */
const getTrendingEmoji = (function() {
  const loader = loaderFor('hot', 1);
  return () => {
    return loader().then((results) => {
      let out = [];
      results.forEach((data) => {
        out = out.concat(data.slice(1));  // drop name
      });
      return out;
    });
  };
}());

/**
 * Requests emoji completion.
 *
 * @param {string} text user has typed
 * @param {boolean} prefix is this a prefix search, or is it a definite whole word?
 * @param {boolean=} more whether to return lots more results for this query
 * @return {!Promise<!Array<!Array>>}
 */
export function request(text, prefix, more=false) {
  if (!text) {
    if (more && text === '') {
      const r = recent();
      r.unshift('^recent');

      return getTrendingEmoji().then((p) => {
        p.unshift('^trending');
        return [r, p];
      });
    }

    return Promise.resolve([]);
  }

  const all = [
    getPrefixGen().then((suggest) => suggest(text, prefix)),
  ];

  if (more) {
    // TODO: At some point, the 'more' data should go into a local cache. For now, just fetch.
    let url = `${api}/q?q=${window.encodeURIComponent(text)}`;
    if (!prefix) {
      url += '&exact';
    }
    const morePromise = window.fetch(url).then((out) => out.json()).then((out) => out['results']);
    all.push(morePromise);
  }

  const typer = type(text);
  if (typer) {
    all.push([['^type', typer]]);
  }

  return Promise.all(all).then((out) => results.merge(...out));
}

/**
 * Records use of name/emoji pairs.
 *
 * @param {string} name used to select emoji
 * @param {string} emoji selected
 * @param {!Promise<!Response>} eventual response after delay
 */
export const select = (function() {
  let pending = {};

  const runner = () => {
    const body = JSON.stringify(pending);
    pending = {};  // clear pending for next time
    return navigator.sendBeacon(api + '/sel', body);
  };

  return function select(name, emoji) {
    if (name[0] === '^') {
      return;  // do nothing
    }

    const r = recent();
    const index = r.indexOf(emoji);
    if (index !== -1) {
      r.splice(index, 1);
    }
    r.unshift(emoji);
    r.splice(recentLimit);
    window.localStorage['recent'] = r.join(',');
    // TODO: do something with recent emoji use

    pending[name] = emoji;
    return promises.debounce(runner, selectionDelay);
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

/**
 * Gets recently used emoji.
 *
 * @return {!Array<string>}
 */
export function recent() {
  return (window.localStorage['recent'] || '').split(',').filter((x) => x);
}