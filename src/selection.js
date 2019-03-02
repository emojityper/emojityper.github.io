
import * as provider from './lib/provider.js';
import * as promises from './lib/promises.js';

// advanced handler
(function(input, advanced) {
  const form = advanced.querySelector('form');
  const namer = form.querySelector('input');
  const button = form.querySelector('button');

  let value = '';
  let pending = null;

  input.addEventListener('query', (ev) => {
    const query = ev.detail;
    value = query.text.trim();
    if (!query.selection || !value) {
      if (!pending) {
        namer.value = '';  // clear on done if not pending
        advanced.hidden = true;
      }
      return false;
    }
    // TODO: round trip to confirm validity of emoji?
    advanced.hidden = false;
  });

  const handler = (ev) => {
    button.disabled = !namer.value;
  };
  'input change'.split(/\s+/).forEach((type) => namer.addEventListener(type, handler));

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (pending) {
      return false;  // can't submit while running
    }

    form.classList.add('pending');
    namer.disabled = true;
    button.disabled = true;

    const cleanup = _ => {
      form.classList.remove('pending');
      namer.disabled = false;
      namer.value = '';
      namer.dispatchEvent(new CustomEvent('change'));

      pending = null;
      if (!value) {
        advanced.hidden = true;
      }
    };

    pending = provider.submit(namer.value, value).then((response) => {
      if (!response.ok) {
        throw new Error(response.status);
      }
      button.classList.add('success');
      return false;
    }).catch((err) => {
      button.classList.add('failure');
      console.warn('failed to submit emoji', err);
      return true;
    }).then(cleanup);

    pending.then(() => promises.delay(2000)).then(() => {
      button.className = '';
    });
  });
}(typer, advanced));
