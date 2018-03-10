import * as chai from 'chai';
import Users from '../../src/firestore/Users';
import config from '../config';
import request from '../../src/request';
import 'mocha';
import * as parallel from 'mocha.parallel';

parallel('UChicago LDAP authentication', () => {
  it('should authenticate config credentials', async () => {
    await Users.authenticateLdap(config.username, config.password);
  });
  it('should not authenticate wrong credentials', async () => {
    return new Promise((resolve, reject) => {
      Users.authenticateLdap('not valid', 'lol').then(
        () => reject(new Error('failed')),
        err => resolve(),
      );
    });
  });
});

parallel('UChicago Shibboleth authentication', () => {
  async function getPrimedCookieJar() {
    const jar = request.jar();
    await request.get(
      'https://evaluations.uchicago.edu/?EvalSearchType=option-number-search&CourseDepartment=PHYS&CourseNumber=13100',
      { jar },
    );
    return jar;
  }

  it('should authenticate config credentials', async () => {
    const jar = await getPrimedCookieJar();
    await Users.authenticateShibboleth(config.username, config.password, jar);
  });
  it('should not authenticate wrong credentials', async () => {
    const jar = await getPrimedCookieJar();
    return new Promise((resolve, reject) => {
      Users.authenticateShibboleth('not valid', 'lol', jar).then(
        () => reject(new Error('failed')),
        err => {
          chai
            .expect(err.message)
            .to.be.equal('Either your username or password is incorrect.');
          resolve();
        },
      );
    });
  });
});
