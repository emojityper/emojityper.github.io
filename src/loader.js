import {sendBeacon} from './polyfill.js';

// defer extra scripts until after 'load' event
window.addEventListener('load', (ev) => {
  if (window.parent) {
    window.parent.postMessage('load', '*');
  }

  window.requestAnimationFrame(() => {
    const scriptPWACompat = document.createElement('script');
    document.head.appendChild(scriptPWACompat);
    scriptPWACompat.outerHTML = `
<script
src="https://cdn.jsdelivr.net/npm/pwacompat@2.0.7/pwacompat.min.js"
integrity="sha384-ptgwb3/v69WGur7IwSnWOowVxE7hcRB3DG/EiHdejrw2sFNwUHynFbiRMPxc4hdS"
crossorigin="anonymous">
</script>`;

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

// enqueue initial GA events
sendBeacon || ga('set', 'transport', 'beacon');
ga('create', 'UA-39885839-6', 'auto');
ga('send', 'pageview');