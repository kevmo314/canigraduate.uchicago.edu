import * as chai from 'chai';
import Users from '../../src/firestore/Users';
import config from '../config';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as sinon from 'sinon';
import * as request from 'supertest';
import 'mocha';
import * as parallel from 'mocha.parallel';

const stubs = sinon.sandbox.create();
let index = null;

function generateAuthorizationHeader({ username, password }) {
  return new Buffer(username + ':' + password, 'utf8').toString('base64');
}

before(() => {
  stubs.stub(admin, 'database');
  stubs.stub(admin, 'initializeApp');
  stubs.stub(Users, 'getToken').resolves('token');
  stubs.stub(functions, 'config').returns({
    firebase: {
      databaseURL: 'https://not-a-project.firebaseio.com',
      storageBucket: 'not-a-project.appspot.com',
    },
  });
  index = require('../../src/index');
});

after(() => {
  stubs.restore();
});

describe('Handlers', () => {
  describe('UChicago Course Evaluations', () => {
    it('should 401 missing credentials', async () => {
      const response = await request(index.api)
        .post('/evaluations/ECON 19800')
        .expect('Content-Type', /json/)
        .expect(401);
      chai
        .expect(response.body.error)
        .to.be.equal('"username" and/or "password" missing in request body.');
    });

    it('should 403 invalid credentials', async () => {
      const response = await request(index.api)
        .post('/evaluations/ECON 19800')
        .set(
          'Authorization',
          'Basic ' +
            generateAuthorizationHeader({
              username: 'incorrect',
              password: 'cows',
            }),
        )
        .expect('Content-Type', /json/)
        .expect(403);
      chai
        .expect(response.body.error)
        .to.be.equal('Either your username or password is incorrect.');
    });

    it('should allow basic auth header evaluations', async () => {
      const response = await request(index.api)
        .post('/evaluations/ECON 19800')
        .set('Authorization', 'Basic ' + generateAuthorizationHeader(config))
        .expect('Content-Type', /json/)
        .expect(200);
      chai.expect(response.body.evaluations).to.have.length.above(0);
    }).timeout(4000);
  });

  describe('UChicago Transcript', () => {
    it('should 401 missing credentials', async () => {
      const response = await request(index.api)
        .post('/transcript')
        .expect('Content-Type', /json/)
        .expect(401);
      chai
        .expect(response.body.error)
        .to.be.equal('"username" and/or "password" missing in request body.');
    });

    it('should 403 invalid credentials', async () => {
      const response = await request(index.api)
        .post('/transcript')
        .set(
          'Authorization',
          'Basic ' +
            generateAuthorizationHeader({
              username: 'incorrect',
              password: 'cows',
            }),
        )
        .expect('Content-Type', /json/)
        .expect(403);
      chai
        .expect(response.body.error)
        .to.be.equal('Either your username or password is incorrect.');
    });

    it('should allow basic auth header', async () => {
      const response = await request(index.api)
        .post('/transcript')
        .set('Authorization', 'Basic ' + generateAuthorizationHeader(config))
        .expect('Content-Type', /json/)
        .expect(200);
      chai.expect(response.body.token).to.be.equal('token');
      chai.expect(response.body.transcript).to.have.length.above(0);
    }).timeout(15000);
  });

  parallel('index handlers', () => {
    it('should list periods', async () => {
      const response = await request(index.api)
        .post('/indexes/periods')
        .expect('Content-Type', /json/)
        .expect(200);
      chai
        .expect(response.body)
        .to.have.members(['Winter', 'Autumn', 'Spring', 'Summer']);
    });

    it('should get data', async () => {
      const response = await request(index.api)
        .post('/indexes/periods/Winter')
        .expect('Content-Type', 'application/octet-stream')
        .expect(200);
      chai.expect(response.body).to.be.instanceof(Buffer);
    });

    it('should return cardinality courses', async () => {
      const response = await request(index.api)
        .post('/indexes/cardinalities/courses')
        .expect('Content-Type', /json/)
        .expect(200);
      chai.expect(response.body).to.be.instanceof(Array);
    });

    it('should return cardinality terms', async () => {
      const response = await request(index.api)
        .post('/indexes/cardinalities/terms')
        .expect('Content-Type', /json/)
        .expect(200);
      chai.expect(response.body).to.be.instanceof(Array);
    });
  });
});
