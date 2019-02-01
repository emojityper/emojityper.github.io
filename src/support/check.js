
if (!window.location.search || window.location.search.indexOf('ignore_check') === -1) {
  const support = true && window.Map && window.WeakMap && window.requestAnimationFrame;
  if (!support) {
    window.location = 'error.html';
  }
}
