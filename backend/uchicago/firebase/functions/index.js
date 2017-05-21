'use strict';

const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const functions = require('firebase-functions');
const serviceAccount = require('./service-account.json');

admin.initializeApp(Object.assign(
    {}, functions.config().firebase,
    {credential: admin.credential.cert(serviceAccount)}));

const app = express();

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Parse authentication headers if available.
app.use((req, res, next) => {
  const authorization = req.get('authorization');
  if (!authorization) {
    if (req.body) {
      req.username = req.body['username'];
      req.password = req.body['password'];
    }
  } else {
    const credentials = new Buffer(authorization.split(' ').pop(), 'base64')
                            .toString('ascii')
                            .split(':');
    req.username = credentials[0];
    req.password = credentials[1];
  }
  next();
});

app.disable('x-powered-by');

app.all('/evaluations/:id', require('./evaluations'));
app.all('/transcript', require('./transcript'));

// Create an error handler.
app.use((err, req, res, next) => {
  console.error('error handler');
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  if (res.statusCode === 200) {
    res.status(400);
  }
  res.json({'error': err.message || err});
});

exports.api = functions.https.onRequest(app);
exports.watches = require('./watches');
exports.grades = require('./aggregate-grades.js');
