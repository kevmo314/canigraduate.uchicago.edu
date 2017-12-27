function* iterator(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i][Symbol.iterator] === 'function') {
      yield* iterator(arr[i]);
    } else {
      yield arr[i];
    }
  }
}

function build(elements, shape) {
  return Array.from({ length: shape[0] }, shape.length == 1 ? ((_, i) => {
    const { done, value } = elements.next();
    if (done) {
      throw new Error('could not reshape, missing value');
    }
    return value;
  }) : ((_, i) => reshape(elements, length / shape[0], shape.slice(1))));
}

export default function reshape(arr, shape = -1) {
  const elements = iterator(arr);
  const result = shape == -1 ? Array.from(elements) : build(elements, shape);
  if (!elements.next().done) {
    throw new Error('could not reshape, extra values');
  }
  return result;
};