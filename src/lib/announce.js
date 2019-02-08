
const post = (m) => window.parent.postMessage(m, '*');

/**
 * Generate announce method if we are hosted inside an iframe.
 */
export const iframeAnnounce = (window.parent && window.parent !== window) ? post : () => {};
