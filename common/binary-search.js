// Modified from https://github.com/google/closure-library/blob/master/closure/goog/array/array.js#L1003

export default function(arr, value) {
  let left = 0; // inclusive
  let right = arr.length; // exclusive
  let found;
  while (left < right) {
    let middle = (left + right) >> 1;
    if (value > arr[middle]) {
      left = middle + 1;
    } else {
      right = middle;
      // We are looking for the lowest index so we can't return immediately.
      found = value == arr[middle];
    }
  }
  return found ? left : ~left;
}
