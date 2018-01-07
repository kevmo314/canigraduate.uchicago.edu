function shape(arr) {
  return typeof arr[Symbol.iterator] == 'function' ? [arr.length, ...shape(arr[0])] : [];  
}

function zeros(dim) {
  return Array.from({ length: dim[0] }).map(_ => dim.length == 1 ? 0 : zeros(dim.slice(1)));
}

export default function splice(arr, dim, index) {
  if (dim == 0) {
    arr.splice(index, 0, zeros(shape(arr[0])));
  } else {
    arr.forEach(row => splice(row, dim - 1, index));
  }
};