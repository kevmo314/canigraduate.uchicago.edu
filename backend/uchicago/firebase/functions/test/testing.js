const admin = require('firebase-admin');
const functions = require('firebase-functions');
const chai = require('chai');
const sinon = require('sinon');
const config = require('./config');

let adminInitStub = null;
let myFunctions = null;
let configStub = null;

before(() => {
  adminInitStub = sinon.stub(admin, 'initializeApp');
  configStub = sinon.stub(functions, 'config').returns({
    firebase: {
      databaseURL: 'https://not-a-project.firebaseio.com',
      storageBucket: 'not-a-project.appspot.com',
    }
  });
  myFunctions = require('../index');
});

after(() => {
  configStub.restore();
  adminInitStub.restore();
});

describe('UChicago Course Evaluations', () => {
  it('should fetch evaluations', done => {
    myFunctions.evaluations(
        {query: {id: 'ECON 19800'}, body: config.credentials}, {
          header: (key, value) => {},
          status: code => {
            chai.assert.equal(code, 200);
          },
          send: response => {
            console.log(response);
            chai.assert.isAbove(JSON.parse(response)['evaluations'].length, 0);
            done();
          },
        });
  }).timeout(5000);
  it('should fail for invalid id', done => {
    myFunctions.evaluations({query: {id: 'ECON'}, body: config.credentials}, {
      header: (key, value) => {},
      status: code => {
        chai.assert.equal(code, 400);
      },
      send: response => {
        console.log(response);
        chai.assert.isString(JSON.parse(response)['error']);
        done();
      },
    });
  });
  it('should fail and echo server error message', done => {
    myFunctions.evaluations(
        {query: {id: 'ECON 99999'}, body: config.credentials}, {
          header: (key, value) => {},
          status: code => {
            chai.assert.equal(code, 400);
          },
          send: response => {
            console.log(response);
            chai.assert.isString(JSON.parse(response)['error']);
            done();
          },
        });
  });
});

describe('UChicago Transcripts', () => {
  it('should fetch transcript', done => {
    myFunctions.transcript({body: config.credentials}, {
      header: (key, value) => {},
      status: code => {
        chai.assert.equal(code, 200);
      },
      send: response => {
        console.log(response);
        chai.assert.isAbove(JSON.parse(response)['transcript'].length, 0);
        done();
      },
    });
  }).timeout(15000);
});