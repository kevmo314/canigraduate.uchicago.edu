import * as chai from 'chai';
import Users from '../../src/firestore/Users';
import Config from '../../src/firestore/Config';
import config from '../config';
import getEvaluations from '../../src/transforms/getEvaluations';
import 'mocha';
import * as parallel from 'mocha.parallel';

parallel('UChicago Course Evaluations', () => {
  it('should fetch evaluations', async () => {
    const evaluations = await getEvaluations('ECON 19800', jar =>
      Users.authenticateShibboleth(config.username, config.password, jar),
    );
    chai.expect(evaluations).to.have.length.above(0);
  });
  it('should fail for invalid id', async () => {
    return new Promise((resolve, reject) => {
      getEvaluations('ECON', jar =>
        Users.authenticateShibboleth(config.username, config.password, jar),
      ).then(reject, resolve);
    });
  });
  it('should fail and echo server error message', async () => {
    return new Promise((resolve, reject) => {
      getEvaluations('ECON 99999', jar =>
        Users.authenticateShibboleth(config.username, config.password, jar),
      ).then(reject, err => {
        const expectedMessage =
          'No evaluations were found. Please update your search criteria and try again.';
        chai.expect(err.message).to.be.equal(expectedMessage);
        resolve();
      });
    });
  });
});
