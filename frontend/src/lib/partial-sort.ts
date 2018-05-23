type Comparator<T> = ((a: T, b: T) => number);

function pivot<T>(A: T[], i: number, j: number): number {
  return i + ((j - i) >> 1);
}

function partition<T>(
  A: T[],
  i: number,
  j: number,
  p: number,
  compare: Comparator<T>
): number {
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

function partialQuickSort<T>(
  A: T[],
  i: number,
  j: number,
  k: number,
  compare: Comparator<T>
) {
  if (i < j) {
    const p = pivot(A, i, j);
    const q = partition(A, i, j, p, compare);
    partialQuickSort(A, i, q - 1, k, compare);
    if (q < k - 1) {
      partialQuickSort(A, q + 1, j, k, compare);
    }
  }
}

export default function<T>(
  A: T[],
  i: number,
  k: number,
  compare: Comparator<T>
): T[] {
  partialQuickSort(A, i, A.length - 1, k, compare);
  return A;
}
