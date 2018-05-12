import IntervalTree from '@/lib/interval-tree';

describe('IntervalTree', () => {
  it('should correctly detect intersections', () => {
    const it = new IntervalTree();

    it.add([10383734, 10594186]);
    it.add([10383734, 10594186]);
    it.add([8891125, 9095610]);
    it.add([9495571, 9677853]);
    it.add([10093457, 10257167]);
    it.add([9303743, 9404967]);
    it.intersects([9303743, 9303744]);
    expect(it.intersects([9303743, 9303744])).toEqual(true);
    expect(it.intersects([10383734, 10383734])).toEqual(true);

    it.add([9495571, 9677853]);
    it.add([9303743, 9404967]);

    expect(it.intersects([9303743, 9303744])).toEqual(true);
    expect(it.intersects([9303742, 9303742])).toEqual(false);

    expect(it.intersects([9404967, 9404967])).toEqual(true);
    expect(it.intersects([9404968, 9404969])).toEqual(false);
  });

  it('should correctly detect intersections 2', () => {
    const it = new IntervalTree();

    expect(it.intersects([1, 2])).toEqual(false);

    it.add([1, 2]);
    expect(it.contains(0.4)).toEqual(false);
    expect(it.contains(1.4)).toEqual(true);

    expect(it.intersects([0, 3])).toEqual(true);
    expect(it.intersects([1.5, 1.6])).toEqual(true);
    expect(it.intersects([2.1, 3.0])).toEqual(false);

    it.add([1.4, 2.1]);

    expect(it.intersects([0, 3])).toEqual(true);
    expect(it.intersects([1.5, 1.6])).toEqual(true);

    expect(it.intersects([2.1, 3.0])).toEqual(true);
  });
});