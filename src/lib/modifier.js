
import {cacheFor} from './cache.js';
import {jsdecode} from '../../node_modules/ok-emoji/src/string.js';
import {isSingleValidEmoji} from '../../node_modules/ok-emoji/src/measurer.js';
import * as emoji from '../../node_modules/ok-emoji/src/emoji.js';

/**
 * @param {string} string to measure
 * @return {boolean} whether this is a single emoji long
 */
const isSingle = cacheFor(isSingleValidEmoji);

/**
 * True if the standard "female" icon can be varied with a diversity modifier. This is the basic
 * level of emoji diversity support, but doesn't imply support for all the professions.
 *
 * @type {boolean}
 */
const basicDiversity = isSingle('\u{1f468}\u{1f3fb}');

/**
 * @type {!Array<number>}
 */
const skipDiversityList = [
  0x1f91d,  // handshake
  0x1f46a,  // nuclear family
  0x1f93c,  // people wrestling
  0x1f46b,  // m+w hands
  0x1f46c,  // m+m hands
  0x1f46d,  // w+w hands
];

/**
 * @param {number} p
 * @return {boolean} whether to skip diversity for this point
 */
function skipDiversity(p) {
  return skipDiversityList.indexOf(p) !== -1;
}

/**
 * @param {number} p
 * @return {boolean} whether the passed rune is a gender character
 */
function isPointGender(p) {
  return p === 0x2640 || p === 0x2642;
}

/**
 * @param {number} p
 * @return {boolean} whether the passed rune is a basic emoji person gender: Man or Woman
 */
function isPersonGender(p) {
  return p === 0x1f468 || p === 0x1f469;
}

/**
 * @param {number} p
 * @return {boolean} whether this is a subordinate member of a family sequence: boy/girl/baby
 */
function isFamilyMember(p) {
  return p === 0x1f476 || p === 0x1f466 || p === 0x1f467;
}

/**
 * Returns details about a character and whether it can be gender flipped to a single or neutral
 * gender. This contains emoji which, due to historical emoji reasons, aren't officially versions
 * of each other: e.g., Santa and Mrs. Claus, or Old {Man,Woman,Adult}.
 *
 * @param {number} point to look up in the other gender flips table
 * @return {{single: boolean, neutral: boolean, points: {f: number, m: number, n: number}}?}
 */
const genderFlip = (function() {
  const list = [
    0x1f468, 0x1f469, 0,        // man, woman (normal case)
    0x1f936, 0x1f385, 0,        // mrs. claus, santa
    0x1f483, 0x1f57a, 0,        // dancers
    0x1f470, 0x1f935, 0,        // bride, man in tuxedo
    0x1f467, 0x1f466, 0x1f9d2,  // girl, boy, child
    0x1f475, 0x1f474, 0x1f9d3,  // old {woman,man,adult}
    0x1f46d, 0x1f46c, 0x1f46b,  // women/men holding hands; note this has 'mixed' for neutral
    0x1f478, 0x1f934, 0,        // princess, prince
  ];

  // build map with raw data only
  const all = new Map();
  for (let i = 0; i < list.length; i += 3) {
    const data = {
      points: {f: list[i], m: list[i+1], n: list[i+2]},
    };
    for (let j = 0; j < 3; ++j) {
      const v = list[i+j];
      if (v) {
        if (all.has(v)) {
          throw new Error('duplicate in gender list: ' + v);
        }
        all.set(v, data);
      }
    }
  }

  // return helper
  return (point) => {
    const out = all.get(point) || null;
    if (out && out.single === undefined) {
      // do the heavy lifting only when first fetched
      out.single =
          isSingle(String.fromCodePoint(out.points.f)) &&
          isSingle(String.fromCodePoint(out.points.m));
      out.neutral = out.points.n ? isSingle(String.fromCodePoint(out.points.n)) : false;
    }
    return out;
  };
}());

/**
 * @param {!Array<number>} points
 * @yields {{part: !Array<number>, trailer: boolean}}
 */
function *reverseParts(points) {
  let last = -1;

  // nb. this actually works in reverse
  do {
    // ugh so many off by ones
    const index = points.lastIndexOf(emoji.runeZWJ, last);
    const from = index + 1;
    const to = (last === -1 ? points.length : last + 1);
    last = index - 1;

    const part = points.slice(from, to);
    if (part.length === 0) {
      continue;  // ignore empty char
    }

    const x = {part: points.slice(from, to), trailer: from !== 0};
    yield x;
  } while (last !== -2);
}

/**
 * @param {!Array<number>} points
 * @return {!Array<!Array<number>>}
 */
function splitPoints(points) {
  let last = 0;
  const out = [];

  for (;;) {
    const index = points.indexOf(emoji.runeZWJ, last);
    const to = (index === -1 ? points.length : index);

    const part = points.slice(last, to);
    if (part.length !== 0) {
      out.push(part);
    }

    if (index === -1) {
      break;
    }
    last = index + 1;
  }

  return out;
}

/**
 * Analyses or modifes an emoji string for modifier support: diversity and gender.
 *
 * This might be O(n), due to the cost of measuring every individual character on some platforms.
 *
 * @param {string} s
 * @param {{tone: (undefined|number), gender: (undefined|string)}=} op
 * @return {
 *   out: (string|undefined),
 *   tone: boolean,
 *   gender: {single: boolean, double: boolean, neutral: boolean},
 * }
 */
export function modify(s, op=undefined) {
  const stats = {tone: false, gender: {single: false, double: false, neutral: false}};

  const all = op !== undefined ? [] : null;
outer:
  for (const points of emoji.iterateEmoji(s)) {
    if (all) {
      all.push(points);  // store for 2nd round
    }

    let genderable = 0;
    let familyLike = false;

    for (const {part, trailer} of reverseParts(points)) {
      // check for early exhaustive answer
      if (op === undefined &&
        (stats.tone || !basicDiversity) &&
        stats.gender.neutral && stats.gender.single && stats.gender.double) {
        break outer;
      }

      const first = part[0];

      if (emoji.isFlagPoint(first)) {
        continue;
      }

      const localFamilyMember = isFamilyMember(first)
      if (trailer && localFamilyMember) {
        familyLike = true;   // familyLike is family member in later part of char
      }

      const localPersonGender = isPersonGender(first)
      if (localFamilyMember || localPersonGender) {
        stats.tone = !familyLike && basicDiversity;
        stats.gender.single = true;
        if (localPersonGender && ++genderable >= 2) {
          stats.gender.double = true;
        }
        continue;  // nothing more to find out here
      }

      if (familyLike) {
        continue;  // no more checks to do
      }

      // check for prescribed gender flips
      const flip = genderFlip(first);
      if (flip !== null) {
        stats.gender.single |= flip.single;
        stats.gender.neutral |= flip.neutral;
      }

      // make sure we're a single valid char now
      if (!isSingle(String.fromCodePoint(...part))) {
        continue;
      }

      // measure if diversity is possible (only on first char)
      if (basicDiversity && !stats.tone && !trailer && !skipDiversity(first)) {
        const cand = String.fromCodePoint(first, 0x1f3fb);
        stats.tone = isSingle(cand);
      }

      // measure if gender is possible
      if (!stats.gender.neutral) {
        const cand = String.fromCodePoint(first, emoji.runeZWJ, 0x2640, emoji.runeVS16);
        const valid = isSingle(cand);
        stats.gender.neutral = valid;
        stats.gender.single = stats.gender.single || valid;
      }
    }
  }

  if (op === undefined) {
    return stats;
  }

  if (op.tone !== undefined && stats.tone) {
    // nb. tones are only ever valid in position 1
    all.forEach((points) => {
      if (emoji.isSkinTone(points[1])) {
        // found one, either replace or clear
        if (op.tone) {
          // great, save in place
          points[1] = op.tone;
        } else {
          const cand = String.fromCodePoint(points[0]);
          if (!isSingle(cand)) {
            points[1] = emoji.runeVS16;  // tone was holding this as emoji
          } else {
            points.splice(1, 1);  // just remove
          }
        }
        return;  // in-place update
      }

      if (!op.tone) {
        // just remove in case one's in a weird place
        const update = points.filter((point) => !emoji.isSkinTone(point));
        points.splice(0, points.length, ...update);
        return;  // in-place update
      }

      if (skipDiversity(points[0])) {
        return;  // skip
      }

      if (points.length === 1 && !isSingle(String.fromCodePoint(points[0]))) {
        return;  // not valid
      }

      const cand = String.fromCodePoint(points[0], op.tone, ...points.slice(1));
      if (!isSingle(cand)) {
        return;
      }
      points.splice(1, 0, op.tone);
    });
  }

  if (op.gender !== undefined) {
    const splitAll = all.map((points) => splitPoints(points));
    const updateSplitAll = splitAll.map((parts, i) => {
      // check last point first
      const hadTrailingGender = isPointGender(parts[parts.length - 1][0]);

      // look for gendered emoji at start of all and flip
      if (!hadTrailingGender) {
        let localOp = [];
        let foundAny = false;
        for (let i = 0; i < parts.length; ++i) {
          const part = parts[i];
          const first = part[0];

          const flip = genderFlip(first);
          if (!flip) {
            if (i === 0) {
              break;  // genderable will always be first, give up
            }
            continue;
          }

          // if we're out of ops, split for more (this might still be blank, but reset anyway)
          localOp = localOp.length ? localOp : op.gender.split('');
          const next = localOp.shift();
          if (foundAny && (!next || isFamilyMember(first))) {
            break;  // if we've already matched some, and now have no more data / is family, fail
          }

          if (!next && flip.neutral) {
            part[0] = flip.points.n;
          } else if (next && flip.single) {
            part[0] = (next === 'm' ? flip.points.m : flip.points.f);
          }
          foundAny = true;
        }
        if (foundAny) {
          return parts;  // don't try to add a gender modifier
        }

        // now, either change trailing gender or try to add one
        if (!op.gender) {
          return null;  // nothing to do
        }

        // we need to see if it's possible, clone _whole_ emoji
        const run = all[i].slice();
        if (!isSingle(run)) {
          return null;  // not valid to apply to anyway
        }
        run.push(emoji.runeZWJ, 0x2640, emoji.runeVS16);
        const cand = String.fromCodePoint(...run);
        if (!isSingle(cand)) {
          return null;
        }
        parts.push([0x2640, emoji.runeVS16]);  // we change this below
      } else if (!op.gender) {
        parts.pop();
        return parts;
      }

      const last = parts[parts.length - 1];
      last[0] = (op.gender[0] === 'm' ? 0x2642 : 0x2640);
      return parts;
    });

    // remerge changed parts
    updateSplitAll.forEach((parts, i) => {
      if (parts === null) {
        return;  // nothing changed here
      }
      const merged = [];
      parts.forEach((part) => {
        merged.push(...part, emoji.runeZWJ);
      });
      merged.pop();  // remove trailing ZWJ
      all[i] = merged;
    });
  }

  stats.out = all.map((points) => String.fromCodePoint(...points)).join('');
  return stats;
}
