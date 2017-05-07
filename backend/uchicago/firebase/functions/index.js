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

app.post('/evaluations/:id', require('./evaluations'));
app.post('/transcript', require('./transcript'));

exports.api = functions.https.onRequest(app);
exports.watches = require('./watches');