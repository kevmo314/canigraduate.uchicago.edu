export default function assign(arr, loc, value) {
  if (loc.length == 1) {
    arr[loc[0]] = value;
  } else {
    assign(arr[loc[0]], loc.slice(1), value);
  }
};