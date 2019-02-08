importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.0.0-rc.0/workbox-sw.js');

workbox.precaching.precacheAndRoute([]);
workbox.googleAnalytics.initialize();

const realURLs = [
  'https://fonts.googleapis.com/',
  'https://fonts.gstatic.com/',
  'https://cdn.jsdelivr.net/npm/',
];
function escape(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
realURLs.forEach((prefix) => {
  // TODO: This only caches the request on the 2nd load. However it's probably coming out of cache
  // for a while anyway because the resources are served with stupid high expiries.
  const r = new RegExp('^' + escape(prefix) + '.*');
  workbox.routing.registerRoute(r, new workbox.strategies.CacheFirst());
});

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());  // become active immediately
});

self.addEventListener('activate', (event) => {
  return self.clients.claim();  // claim, causing window.location.reload()
});
