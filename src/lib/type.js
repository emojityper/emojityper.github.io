const options = {
  'abcd': [0x1f521],
  'abc': [0x1f524],
  'ab': [0x1f18e],
  'a': [0x1f170, 0xfe0f],
  'atm': [0x1f3e7],
  'cool': [0x1f192],
  'free': [0x1f193],
  'id': [0x1f194],
  'i': [0x2139, 0xfe0f],
  'm': [0x24c2, 0xfe0f],
  'ok': [0x1f197],
  'o': [0x1f17e, 0xfe0f],
  'p': [0x1f17f, 0xfe0f],
  'sos': [0x1f198],
  'up': [0x1f199],
  'vs': [0x1f19a],
  '!!': [0x203c, 0xfe0f],
  '!?': [0x2049, 0xfe0f],
  '!': [0x2757],
  '?': [0x2753],
  '$': [0x1f4b2],
  '£': [0x1f4b7],
  '€': [0x1f4b6],  // FIXME: emojityper doesn't think this is a word char
  '¥': [0x1f4b4],
  'new': [0x1f195],
  'ng': [0x1f196],
  'zzz': [0x1f4a4],
  '1234': [0x1f522],
  'cl': [0x1f191],
  'b': [0x1f171, 0xfe0f],
  'wc': [0x1f6be],
  '100': [0x1f4af],
  '10': [0x1f51f],
  '*': [0x2a, 0xfe0f, 0x20e3],
  '#': [0x23, 0xfe0f, 0x20e3],
// "tm" is a bit subtle
//  'tm': [0x2122, 0xfe0f],
  '<': [0x25c0, 0xfe0f],
  '>': [0x25b6, 0xfe0f],
  '^': [0x1f53c],
  '+': [0x2795],
  '-': [0x2796],
  'x': [0x274e],
  '~': [0x3030, 0xfe0f],
  '.': [0x23fa, 0xfe0f],
};


const keys = Object.keys(options);
keys.sort((a, b) => {
  if (a.length !== b.length) {
    return b.length - a.length;
  }
  if (a < b) {
    return -1;
  } else if (a > b) {
    return +1;
  }
  return 0;
});


const matchPrefix = (s, preferLetter) => {
  let cand = null;

  if (s[0] >= 'a' && s[0] <= 'z') {
    const point = 0x1f1e6 + (s.codePointAt(0) - 97);
    cand = {length: 1, points: [point, 0xfe0f]};
  } else if (s[0] >= '0' && s[0] <= '9') {
    const point = 0x30 + (s.codePointAt(0) - 48);
    cand = {length: 1, points: [point, 0xfe0f, 0x20e3]};
  }

  if (preferLetter && cand) {
    return cand;
  }

  for (const k of keys) {
    if (s.startsWith(k)) {
      return {length: k.length, points: options[k]};
    }
  }
  return cand;
};


export default function(value, preferLetter=false) {
  let work = value.toLowerCase();
  const out = [];

  while (work.length) {
    const matched = matchPrefix(work, preferLetter);
    if (matched === null) {
      return null;  // fail early, can't emoji-fy this
    }
    out.push(...matched.points);
    work = work.substr(matched.length);
  }

  return String.fromCodePoint(...out);
}