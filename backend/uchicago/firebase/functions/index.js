'use strict';

const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post('/evaluations/:id', require('./evaluations'));
app.post('/transcript', require('./transcript'));

exports.api = functions.https.onRequest(app);
exports.watches = require('./watches');