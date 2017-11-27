// munkres-js is too slow for our uses.
// Perhaps this can be released as FastMunkres or something.

// Based off of the implementation at https://www.topcoder.com/community/data-science/data-science-tutorials/assignment-problem-and-hungarian-algorithm/
// The one at http://csclab.murraystate.edu/~bob.pilgrim/445/munkres.html
// is good, but could be more efficient.

/**
 * Compute the lowest-cost matching.
 * @param {!Array<!Array<number>>} A matrix of weights
 * @returns {!Map<number, number>}
 */
export default function munkres(A) {
  if (A.length != A[0].length) {
    throw new Error('Cost matrix must be square.');
  }
  const N = A.length;
  const forward = new Array(N).fill(-1);
  const reverse = new Array(N).fill(-1);
  const forwardLabels = A.map(row => {
    return row.reduce((a, b) => (a > b ? a : b), Number.NEGATIVE_INFINITY);
  });
  const reverseLabels = new Array(N).fill(0);
  for (let matched = 0; matched < N; matched++) {
    const queue = [];
    const S = new Array(N);
    const T = new Array(N);
    const parent = new Array(N);
    const root = forward.indexOf(-1);
    // This node is not matched.
    queue.push(root);
    parent[root] = -2; // This is the root.
    S[root] = true; // This node is included on the path.
    const slack = reverseLabels.map((reverseLabel, j) => {
      return forwardLabels[root] + reverseLabel + A[root][j];
    });
    const slackIndex = new Array(N).fill(root);
    function updateLabels() {
      const delta = slack.reduce(
        (min, x, j) => (!T[j] && x < min ? x : min),
        Number.POSITIVE_INFINITY,
      );
      for (let i = 0; i < N; i++) {
        if (S[i]) {
          forwardLabels[i] -= delta;
        }
        if (T[i]) {
          reverseLabels[i] -= delta;
        } else {
          slack[i] -= delta;
        }
      }
    }
    function addToTree(i, previous) {
      S[i] = true;
      parent[i] = previous;
      for (let j = 0; j < N; j++) {
        const cost = forwardLabels[i] + reverseLabels[j] + A[i][j];
        if (cost < slack[j]) {
          slack[j] = cost;
          slackIndex[j] = i;
        }
      }
    }
    function findAugmentingPath() {
      while (queue.length > 0) {
        const i = queue.shift();
        for (let j = 0; j < N; j++) {
          if (-A[i][j] == forwardLabels[i] + reverseLabels[j] && !T[j]) {
            if (reverse[j] == -1) {
              // Found the exposed vertex.
              return [i, j];
            }
            T[j] = true;
            queue.push(reverse[j]);
            addToTree(reverse[j], i);
          }
        }
      }
      // No augmenting path found, improve labeling.
      updateLabels();
      queue.length = 0;
      for (let j = 0; j < N; j++) {
        if (!T[j] && slack[j] == 0) {
          if (reverse[j] == -1) {
            return [slackIndex[j], j];
          } else {
            T[j] = true;
            if (!S[reverse[j]]) {
              queue.push(reverse[j]);
              addToTree(reverse[j], slackIndex[j]);
            }
          }
        }
      }
    }
    let result = null;
    while (!(result = findAugmentingPath()));
    for (let [cx, cy] = result, ty; cx != -2; cx = parent[cx], cy = ty) {
      [ty, reverse[cy], forward[cx]] = [forward[cx], cx, cy];
    }
  }
  return forward;
}
