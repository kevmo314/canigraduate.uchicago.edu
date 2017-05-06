'use strict';

const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const evaluations = require('./evaluations');
const functions = require('firebase-functions');
const transcript = require('./transcript');

admin.initializeApp(functions.config().firebase);

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post('/evaluations/:id', evaluations);
app.post('/transcript', transcript);

exports.api = functions.https.onRequest(app);