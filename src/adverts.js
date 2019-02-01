import {rAF} from './lib/promises.js';

/**
 * @fileoverview Rotates through various advertisements in Emojityper.
 */

const delay = 10 * 1000;
const initialDelay = 2 * delay;

const rotate = document.getElementById('rotate');
const all = Array.from(rotate.children);  // nb. these are in DOM for SEO

async function run() {
  await rAF(initialDelay);

  const initial = all.shift();
  initial.classList.remove('active');
  all.sort(() => Math.random() - 0.5);

  for (;;) {
    all[0].classList.add('active');
    await rAF(delay);

    all[0].classList.remove('active');
    all.push(all.shift());
  }
}

run().catch(console.warn);

