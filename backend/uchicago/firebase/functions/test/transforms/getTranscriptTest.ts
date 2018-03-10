import * as chai from 'chai';
import Users from '../../src/firestore/Users';
import config from '../config';
import getTranscript from '../../src/transforms/getTranscript';
import 'mocha';

describe('UChicago Transcripts', () => {
  it('should fetch transcript', async () => {
    const transcript = await getTranscript(jar =>
      Users.authenticateShibboleth(config.username, config.password, jar),
    );
    chai.expect(transcript).to.have.length.above(0);
  }).timeout(15000);
});
