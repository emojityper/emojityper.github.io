import {sendBeacon} from './polyfill.js';
import {iframeAnnounce} from './lib/announce.js';

// defer extra scripts until after 'load' event
window.addEventListener('load', (ev) => {
  iframeAnnounce('load');

  window.requestAnimationFrame(() => {
    const scriptPWACompat = document.createElement('script');
    scriptPWACompat.src = 'https://cdn.jsdelivr.net/npm/pwacompat@2.0.9/pwacompat.min.js';
    scriptPWACompat.setAttribute('integrity', 'sha384-VcI6S+HIsE80FVM1jgbd6WDFhzKYA0PecD/LcIyMQpT4fMJdijBh0I7Iblaacawc');
    scriptPWACompat.setAttribute('crossorigin', 'anonymous');
    document.head.appendChild(scriptPWACompat);
    // nb. the outerHTML trick doesn't seem to work

    if (!document.currentScript) {
      // absence indicates we're in module mode, so load extended code
      const scriptExtended = document.createElement('script');
      scriptExtended.src = document.body.getAttribute('data-ext');
      scriptExtended.type = 'module';
      document.head.appendChild(scriptExtended);
    }

    if (window._dev) {
      return;  // don't analytics in dev
    }

    const scriptAnalytics = document.createElement('script');
    scriptAnalytics.src = 'https://www.google-analytics.com/analytics.js';
    document.head.appendChild(scriptAnalytics);
  });
});

// create local GA, this matches the 'isogram' code
const tempGA = function() {
  tempGA['q'].push(arguments);
};
tempGA['q'] = [];
tempGA['l'] = 1 * new Date;
window['ga'] = tempGA;
window['GoogleAnalyticsObject'] = 'ga';

window.addEventListener('message', (ev) => {
  const type = ev.data.type || '';
  switch (type) {
    case 'ga':
      // used by extension to log load time
      ga.apply(null, ev.data.payload);
      break;
    default:
      console.debug('unhandled message', ev.data);
  }
});

// enqueue initial GA events
sendBeacon || ga('set', 'transport', 'beacon');
ga('create', 'UA-39885839-6', 'auto');
ga('send', 'pageview');