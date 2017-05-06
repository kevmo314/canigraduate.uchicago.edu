'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const chai = require('chai');
const config = require('./config');
const sinon = require('sinon');
const request = require('supertest');

let adminInitStub = null;
let index = null;
let configStub = null;

before(() => {
  adminInitStub = sinon.stub(admin, 'initializeApp');
  configStub = sinon.stub(functions, 'config').returns({
    firebase: {
      databaseURL: 'https://not-a-project.firebaseio.com',
      storageBucket: 'not-a-project.appspot.com',
    }
  });
  index = require('../index');
});

after(() => {
  configStub.restore();
  adminInitStub.restore();
});


describe('UChicago Course Evaluations', () => {
  it('should fetch evaluations', done => {
    request(index.api)
        .post('/evaluations/ECON 19800')
        .send(config.credentials)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(
            response =>
                chai.assert.isAbove(response.body['evaluations'].length, 0))
        .end(done);
  });
  it('should fail for invalid id', done => {
    request(index.api)
        .post('/evaluations/ECON')
        .send(config.credentials)
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(response => chai.assert.isString(response.body['error']))
        .end(done);
  });
  it('should fail and echo server error message', done => {
    request(index.api)
        .post('/evaluations/ECON 99999')
        .send(config.credentials)
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
        .send(config.credentials)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(
            response =>
                chai.assert.isAbove(response.body['transcript'].length, 0))
        .end(done);
  }).timeout(15000);
});