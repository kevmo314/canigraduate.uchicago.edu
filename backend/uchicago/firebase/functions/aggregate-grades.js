'use strict';

const admin = require('firebase-admin');
const base64url = require('base64url');
const crypto = require('crypto');
const functions = require('firebase-functions');

module.exports = functions.pubsub.topic('grades').onPublish(event => {
  const chicagoId = event.data.json['chicagoId'];
  const record = event.data.json['record'];
  const key = base64url(
    crypto.pbkdf2Sync(
      [record['term'], record['course'], record['section']].join(),
      chicagoId,
      2000000,
      20,
      'sha512',
    ),
  );
  admin.database().ref(`/grades/raw/${key}/`).set({
    course: record['course'],
    section: record['section'],
    term: record['term'],
    gpa: record['gpa'],
    tenure: record['tenure'],
  });
});
