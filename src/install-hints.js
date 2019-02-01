
// install code, delay by ~2500ms on load

window.setTimeout(() => {
  const dismissKey = 'dismiss-install';
  const sourceKey = 'sources';
  const sources = (window.localStorage[sourceKey] || '').split(',').filter(Boolean);

  const sourceMatch = /utm_source=([_\w\d]*)/;
  const m = sourceMatch.exec(window.location.search);
  if (m) {
    if (sources.indexOf(m[1]) === -1) {
      sources.push(m[1]);
    }
    window.localStorage[sourceKey] = sources.join(',');
  }

  if (sources.length || window.localStorage[dismissKey]) {
    return;  // we have been installed somewhere already
  }

  const footer = document.querySelector('footer');
  footer.addEventListener('click', (ev) => {
    if (!ev.target.classList.contains('dismiss-install')) {
      return;
    }
    ga('send', 'event', 'install', 'dismiss');
    window.localStorage[dismissKey] = true;
    document.body.removeAttribute('data-install');
  });

  // TODO(samthor): Allow showing both ext/windows on say, Chrome Windows.
  if (document.body.dataset['install']) {
    // we probably got pipped to the post by PWA install, great
  } else if (navigator.userAgent.match(/Chrome\//) && navigator.platform.match(/^(Mac|Win|Linux)/)) {
    // We're Chrome on some kind of desktop
    document.body.dataset['install'] = 'ext';
  } else if (typeof Windows === 'undefined' && navigator.platform.startsWith('Win')) {
    // 'Windows' not found (not already installed), and on Windows
    document.body.dataset['install'] = 'windows';
  }

}, 2500);

// PWA install code below, run immediately

(function() {

  let deferredPrompt = null;

  function cleanupPrompt() {
    document.body.removeAttribute('data-install');
    deferredPrompt = null;
  }

  window.addEventListener('beforeinstallprompt', (ev) => {
    ga('send', 'event', 'install', 'available');
    document.body.dataset['install'] = 'pwa';
    deferredPrompt = ev;
    ev.preventDefault();
    return false;
  });

  window.addEventListener('appinstalled', (ev) => {
    ga('send', 'event', 'install', 'installed');
    cleanupPrompt();
  });

  const installEl = document.getElementById('install');
  installEl.addEventListener('click', (ev) => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();

    if (!deferredPrompt.userChoice) {
      return;  // older Chrome
    }

    deferredPrompt.userChoice.then((result) => {
      ga('send', 'event', 'install', result);
      // TODO: should we listen to appinstalled? I suppose we don't know what the user said.
    }).catch((err) => {
      console.warn('beforeinstallprompt prompt', err);
    }).then(cleanupPrompt);
  });

}());
