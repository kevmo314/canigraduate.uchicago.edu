'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const chai = require('chai');
const config = require('./config');
const nodemailerMock = require('nodemailer-mock');
const mockery = require('mockery');
const sinon = require('sinon');
const request = require('supertest');
const {authenticate} = require('../authentication');

const stubs = sinon.sandbox.create();
let index = null;
let transportMock = sinon.mock({sendMail: () => {}});

function generateAuthorizationHeader(credentials) {
return new Buffer(credentials.username + ':' + credentials.password, 'utf8').toString('base64');
}

before(() => {
  mockery.enable({warnOnUnregistered: false});
  mockery.registerMock('nodemailer', nodemailerMock);
  mockery.registerMock('@google-cloud/pubsub', () => {
    return {
      topic: () => {
        return {
          publish: () => {
            return Promise.resolve();
          },
        };
      },
    };
  });
  stubs.stub(admin, 'initializeApp');
  stubs.stub(admin, 'auth').returns({
    createUser: stubs.stub().returns(Promise.resolve()),
    createCustomToken: stubs.stub().returns(Promise.resolve('token')),
  });
  stubs.stub(functions, 'config').returns({
    firebase: {
      databaseURL: 'https://not-a-project.firebaseio.com',
      storageBucket: 'not-a-project.appspot.com',
    },
    smtp: {
      email: 'cows@mugit.com',
      password: 'moocows',
    },
  });
  index = require('../index');
});

afterEach(() => {
  nodemailerMock.mock.reset();
});

after(() => {
  stubs.restore();
  mockery.deregisterAll();
  mockery.disable();
});

describe('UChicago LDAP authentication', () => {
  it('should authenticate config credentials', () => {
    return authenticate(
        config.credentials.username, config.credentials.password);
  });
  it('should not authenticate wrong credentials', done => {
    authenticate('not valid', 'lol').catch(err => done());
  });
});

describe('UChicago Course Evaluations', () => {
  it('should 401 missing credentials', done => {
    request(index.api)
        .post('/evaluations/ECON 19800')
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(response => chai.assert.isString(response.body['error']))
        .end(done);
  }).timeout(4000);
  it('should 401 invalid credentials', done => {
    request(index.api)
        .post('/evaluations/ECON 19800')
        .set('Authorization', 'Basic ' + generateAuthorizationHeader({'username': 'incorrect', 'password': 'cows'}))
        .expect('Content-Type', /json/)
        .expect(401)
        .expect(response => chai.assert.isString(response.body['error']))
        .end(done);
  }).timeout(4000);
  it('should fetch evaluations', done => {
    request(index.api)
        .post('/evaluations/ECON 19800')
        .set('Authorization', 'Basic ' + generateAuthorizationHeader(config.credentials))
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(response => {
          chai.assert.isAbove(response.body['evaluations'].length, 0);
          chai.assert.equal(response.body['token'], 'token');
        })
        .end(done);
  }).timeout(4000);
  it('should allow basic auth header evaluations', done => {
    request(index.api)
        .post('/evaluations/ECON 19800')
        .set('Authorization', 'Basic ' + generateAuthorizationHeader(config.credentials))
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(response => {
          chai.assert.isAbove(response.body['evaluations'].length, 0);
          chai.assert.equal(response.body['token'], 'token');
        })
        .end(done);
  }).timeout(4000);
  it('should fail for invalid id', done => {
    request(index.api)
        .post('/evaluations/ECON')
        .set('Authorization', 'Basic ' + generateAuthorizationHeader(config.credentials))
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(response => chai.assert.isString(response.body['error']))
        .end(done);
  });
  it('should fail and echo server error message', done => {
    request(index.api)
        .post('/evaluations/ECON 99999')
        .set('Authorization', 'Basic ' + generateAuthorizationHeader(config.credentials))
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(response => chai.assert.isString(response.body['error']))
        .end(done);
  });
});

describe('UChicago Transcripts', () => {
  it('should fetch transcript', done => {
    request(index.api)
        .post('/transcript')
        .set('Authorization', 'Basic ' + generateAuthorizationHeader(config.credentials))
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(response => {
          chai.assert.isAbove(response.body['transcript'].length, 0);
          chai.assert.equal(response.body['token'], 'token');
        })
        .end(done);
  }).timeout(15000);
});

describe('UChicago Watches', () => {
  let sandbox, valueStub;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    const refStub = sandbox.stub();
    sandbox.stub(admin, 'database').returns({ref: refStub});
    refStub.withArgs('/watches').returns({once: valueStub = sandbox.stub()});
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should notify on matching', done => {
    valueStub.withArgs('value').returns(Promise.resolve({
      'mugit': [{
        'course': 'MATH 16100',
      }]
    }));

    index
        .watches({
          data: new functions.database.DeltaSnapshot(
              null, null, {'enrollment': ['4', '10']},
              {'enrollment': ['5', '10']}),
          params: {
            course: 'MATH 16100',
            year: '2010',
            period: 'Winter',
            section: '01',
          },
        })
        .then(() => {
          const sentMail = nodemailerMock.mock.sentMail();
          chai.assert.lengthOf(sentMail, 1);
          chai.assert.equal(sentMail[0].to, 'mugit@uchicago.edu');
          chai.assert.equal(sentMail[0].bcc, 'kdwang@uchicago.edu');
          chai.assert.include(sentMail[0].text, '4/10 -> 5/10');
          done();
        })
        .catch(done);
  });

  it('should notify on matching case insensitive', done => {
    valueStub.withArgs('value').returns(
        Promise.resolve({'mugit': [{'course': 'math 16100'}]}));

    index
        .watches({
          data: new functions.database.DeltaSnapshot(
              null, null, {'enrollment': ['4', '10']},
              {'enrollment': ['5', '10']}),
          params: {
            course: 'MATH 16100',
            year: '2010',
            period: 'Winter',
            section: '01',
          },
        })
        .then(() => {
          const sentMail = nodemailerMock.mock.sentMail();
          chai.assert.lengthOf(sentMail, 1);
          chai.assert.equal(sentMail[0].to, 'mugit@uchicago.edu');
          chai.assert.equal(sentMail[0].bcc, 'kdwang@uchicago.edu');
          chai.assert.include(sentMail[0].text, '4/10 -> 5/10');
          done();
        })
        .catch(done);
  });

  it('should not notify on non matching', done => {
    valueStub.withArgs('value').returns(Promise.resolve({
      'mugit': [{
        'course': 'MATH 15100',
      }]
    }));

    index
        .watches({
          data: new functions.database.DeltaSnapshot(
              null, null, {'enrollment': ['4', '10']},
              {'enrollment': ['5', '10']}),
          params: {
            course: 'MATH 16100',
            year: '2010',
            period: 'Winter',
            section: '01',
          },
        })
        .then(() => {
          const sentMail = nodemailerMock.mock.sentMail();
          chai.assert.lengthOf(sentMail, 0);
          done();
        })
        .catch(done);
  });

  it('should notify on matching exactly', done => {
    valueStub.withArgs('value').returns(Promise.resolve({
      'mugit': [
        {
          'course': 'MATH 16100',
          'term': 'Winter 2010',
          'section': '01',
        },
        {
          'course': 'MATH 16100',
          'term': 'Winter 2010',
        },
        {'course': 'MATH 16100'}
      ]
    }));

    index
        .watches({
          data: new functions.database.DeltaSnapshot(
              null, null, {'enrollment': ['4', '10']},
              {'enrollment': ['5', '10']}),
          params: {
            course: 'MATH 16100',
            year: '2010',
            period: 'Winter',
            section: '01',
          },
        })
        .then(() => {
          const sentMail = nodemailerMock.mock.sentMail();
          chai.assert.lengthOf(sentMail, 3);
          chai.assert.equal(sentMail[0].to, 'mugit@uchicago.edu');
          chai.assert.equal(sentMail[0].bcc, 'kdwang@uchicago.edu');
          chai.assert.include(sentMail[0].text, '4/10 -> 5/10');
          done();
        })
        .catch(done);
  });

  it('should not notify on not matching exactly', done => {
    valueStub.withArgs('value').returns(Promise.resolve({
      'mugit': [
        {
          'course': 'MATH 16100',
          'term': 'Winter 2010',
          'section': '02',
        },
        {
          'course': 'MATH 16100',
          'term': 'Autumn 2010',
          'section': '01',
        },
        {
          'course': 'MATH 15100',
          'term': 'Winter 2010',
          'section': '01',
        }
      ]
    }));

    index
        .watches({
          data: new functions.database.DeltaSnapshot(
              null, null, {'enrollment': ['4', '10']},
              {'enrollment': ['5', '10']}),
          params: {
            course: 'MATH 16100',
            year: '2010',
            period: 'Winter',
            section: '01',
          },
        })
        .then(() => {
          const sentMail = nodemailerMock.mock.sentMail();
          chai.assert.lengthOf(sentMail, 0);
          done();
        })
        .catch(done);
  });

  it('should notify everyone', done => {
    valueStub.withArgs('value').returns(Promise.resolve({
      'mugit1': [{'course': 'MATH 16100'}],
      'mugit2': [{'course': 'MATH 16100'}],
      'mugit3': [{'course': 'MATH 16100'}],
    }));

    index
        .watches({
          data: new functions.database.DeltaSnapshot(
              null, null, {'enrollment': ['4', '10']},
              {'enrollment': ['5', '10']}),
          params: {
            course: 'MATH 16100',
            year: '2010',
            period: 'Winter',
            section: '01',
          },
        })
        .then(() => {
          const sentMail = nodemailerMock.mock.sentMail();
          chai.assert.lengthOf(sentMail, 3);
          chai.assert.sameMembers(sentMail.map(x => x.to), [
            'mugit1@uchicago.edu', 'mugit2@uchicago.edu', 'mugit3@uchicago.edu'
          ]);
          done();
        })
        .catch(done);
  });

  it('should not notify on no change', done => {
    valueStub.withArgs('value').returns(
        Promise.resolve({'mugit1': [{'course': 'MATH 16100'}]}));

    const enrollment = ['4', '10'];

    index
        .watches({
          data: new functions.database.DeltaSnapshot(
              null, null, {'enrollment': enrollment},
              {'enrollment': enrollment}),
          params: {
            course: 'MATH 16100',
            year: '2010',
            period: 'Winter',
            section: '01',
          },
        })
        .then(() => {
          const sentMail = nodemailerMock.mock.sentMail();
          chai.assert.lengthOf(sentMail, 0);
          done();
        })
        .catch(done);
  });

  it('should include secondaries change', done => {
    valueStub.withArgs('value').returns(
        Promise.resolve({'mugit1': [{'course': 'MATH 16100'}]}));

    index
        .watches({
          data: new functions.database.DeltaSnapshot(
              null, null, {
                'enrollment': ['4', '10'],
                'secondaries': {'01': {'enrollment': ['3', '10']}},
              },
              {
                'enrollment': ['4', '10'],
                'secondaries': {'01': {'enrollment': ['4', '10']}},
              }),
          params: {
            course: 'MATH 16100',
            year: '2010',
            period: 'Winter',
            section: '01',
          },
        })
        .then(() => {
          const sentMail = nodemailerMock.mock.sentMail();
          chai.assert.lengthOf(sentMail, 1);
          done();
        })
        .catch(done);
  });

  it('should not notify on secondaries no change', done => {
    valueStub.withArgs('value').returns(
        Promise.resolve({'mugit1': [{'course': 'MATH 16100'}]}));

    index
        .watches({
          data: new functions.database.DeltaSnapshot(
              null, null, {
                'enrollment': ['4', '10'],
                'secondaries': {'01': {'enrollment': ['4', '10']}},
              },
              {
                'enrollment': ['4', '10'],
                'secondaries': {'01': {'enrollment': ['4', '10']}},
              }),
          params: {
            course: 'MATH 16100',
            year: '2010',
            period: 'Winter',
            section: '01',
          },
        })
        .then(() => {
          const sentMail = nodemailerMock.mock.sentMail();
          chai.assert.lengthOf(sentMail, 0);
          done();
        })
        .catch(done);
  });
});