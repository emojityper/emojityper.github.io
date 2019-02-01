
/**
 * @fileoverview Entrypoint for nomodule builds.
 */

import '../support/check.js';
import '../support/polyfill.js';
import './main.js';

// from ext.js, but included in bundle
import '../adverts.js';
import '../placeholders.js';
import '../sw.js';
