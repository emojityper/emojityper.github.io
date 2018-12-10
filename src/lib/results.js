
/**
 * Remove duplicate entries from the passed array, only from the 1th index.
 *
 * @param {!Array<string>}
 * @return {!Array<string>}
 */
function removeDuplicates(row) {
  const found = new Set();
  return row.filter((item, i) => {
    if (i !== 0) {
      if (found.has(item)) { return false; }
      found.add(item);
    }
    return true;
  });
}

/**
 * Merge the given results arrays. These will both be in the form of:
 *   [[name, emoji1, emoji2,....], ...]
 *
 * The first argument will be updated with the data from the following arguments.
 *
 * @param {...!Array<!Array<string>>} all
 */
export function merge(...all) {
  if (!all.length) {
    return [];
  }

  const lookup = {};
  const existing = all.shift();
  existing.forEach((row, i) => lookup[row[0]] = i);

  all.forEach((update) => {
    update.forEach((row) => {
      const index = lookup[row[0]];
      if (index === undefined) {
        lookup[row[0]] = existing.length;  // in case there's dup data
        existing.push(row);
        return;
      }
  
      // otherwise, just append all new data and place back into array
      const existingRow = existing[index];
      const updatedData = row.slice(1);
      existing[index] = removeDuplicates(existingRow.concat(updatedData));
    });
  });

  return existing;
}