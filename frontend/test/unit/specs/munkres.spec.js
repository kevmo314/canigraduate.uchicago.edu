import { expect } from 'chai';
import munkres from '@/lib/munkres';

describe('Munkres Algorithm', () => {
  it('handles singleton matrix', () => {
    const matrix = [[5]];
    expect(munkres(matrix)).to.deep.equal([0]);
  });

  it('handles negative singleton matrix', () => {
    const matrix = [[-5]];
    expect(munkres(matrix)).to.deep.equal([0]);
  });

  it('handles 2-by-2 matrix', () => {
    const matrix = [[5, 3], [2, 4]];
    expect(munkres(matrix)).to.deep.equal([1, 0]); // smallest cost is 3+2=5
  });

  it('handles 2-by-2 negative matrix', () => {
    const matrix = [[-5, -3], [-2, -4]];
    expect(munkres(matrix)).to.deep.equal([0, 1]);
  });

  it('handles 3-by-3 matrix', () => {
    const matrix = [[5, 3, 1], [2, 4, 6], [9, 9, 9]];
    expect(munkres(matrix)).to.deep.equal([2, 0, 1]); // smallest cost is 1+2+9=12
  });

  it('handles another 3-by-3 matrix', () => {
    const matrix = [[400, 150, 400], [400, 450, 600], [300, 225, 300]];
    expect(munkres(matrix)).to.deep.equal([1, 0, 2]);
  });

  it('handles 3-by-3 matrix with both positive and negative values', () => {
    const matrix = [[5, 3, -1], [2, 4, -6], [9, 9, -9]];
    expect(munkres(matrix)).to.deep.equal([1, 0, 2]);
  });

  it('handles all-zero 3-by-3 matrix', () => {
    const matrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    expect(munkres(matrix)).to.deep.equal([0, 1, 2]);
  });

  it('handles TopCoder example matrix', () => {
    const matrix = [[-7, -4, -3], [-3, -1, -2], [-3, 0, 0]];
    expect(munkres(matrix)).to.deep.equal([0, 2, 1]); // same cost as [1, 2, 0].
  });

  it('handles inverse TopCoder example matrix', () => {
    const matrix = [[7, 4, 3], [3, 1, 2], [3, 0, 0]];
    expect(munkres(matrix)).to.deep.equal([2, 0, 1]);
  });
});
