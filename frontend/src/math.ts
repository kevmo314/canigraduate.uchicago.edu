export function median(values: number[]): number {
  if (values.length === 0) {
    return NaN;
  }
  values = values.slice().sort();
  return (values[(values.length - 1) >> 1] + values[values.length >> 1]) / 2;
}

export function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}
