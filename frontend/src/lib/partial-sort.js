function pivot(A, i, j) {
  return i + ((j - i) >> 1);
}

function partition(A, i, j, p, compare) {
  [A[p], A[j]] = [A[j], A[p]];
  for (let k = i; k < j; k++) {
    if (compare(A[k], A[j]) < 0) {
      [A[i], A[k]] = [A[k], A[i]];
      i++;
    }
  }
  [A[i], A[j]] = [A[j], A[i]];
  return i;
}

function partialQuickSort(A, i, j, k, compare) {
  if (i < j) {
    const p = pivot(A, i, j);
    const q = partition(A, i, j, p, compare);
    partialQuickSort(A, i, q - 1, k, compare);
    if (q < k - 1) {
      partialQuickSort(A, q + 1, j, k, compare);
    }
  }
}

export default function(A, i, k, compare) {
  partialQuickSort(A, i, A.length - 1, k, compare);
  return A;
}
