
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

// global error handler for logs
window.onerror = (msg, file, line, col, error) => {
  console.info('got err', String(msg));
  try {
    ga('send', 'event', 'error', `${file},${line}:${col}`, String(msg), {nonInteraction: true});
  } catch (e) {}
};


// add stuff after load

window.addEventListener('load', (ev) => {
  window.requestAnimationFrame(() => {
    const scriptPWACompat = document.createElement('script');
    document.head.appendChild(scriptPWACompat);
    scriptPWACompat.outerHTML = `
<script
async
src="https://cdn.jsdelivr.net/npm/pwacompat@2.0.7/pwacompat.min.js"
integrity="sha384-ptgwb3/v69WGur7IwSnWOowVxE7hcRB3DG/EiHdejrw2sFNwUHynFbiRMPxc4hdS"
crossorigin="anonymous">
</script>`;

    if (window._dev) {
      return;  // don't analytics in dev
    }

    const scriptAnalytics = document.createElement('script');
    scriptAnalytics.src = 'https://www.google-analytics.com/analytics.js';
    scriptAnalytics.async = true;
    document.head.appendChild(scriptAnalytics);
  });
});


window['GoogleAnalyticsObject'] = 'ga';

const prep = function() {
  prep['q'].push(arguments);
};
prep['q'] = [];
prep['l'] = 1 * new Date;
window['ga'] = prep;

navigator.sendBeacon && ga('set', 'transport', 'beacon');
ga('create', 'UA-39885839-6', 'auto');
ga('send', 'pageview');