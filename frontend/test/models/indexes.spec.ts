import Indexes from '../../src/models/indexes';
import Axios from 'axios';
import 'jasmine';

describe('Indexes', () => {
  let indexes = null;
  beforeAll(() => {
    return Axios.get(
      'https://storage.googleapis.com/uchicago/indexes.json.gz',
    ).then(({ data }) => (indexes = new Indexes(data)));
  });
  it('should have courses', () => {
    expect(indexes).toHaveLength(4);
  });
});
