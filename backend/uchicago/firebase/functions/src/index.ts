import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as compression from 'compression';
import * as express from 'express';
import * as functions from 'firebase-functions';
import * as crypto from 'crypto';
import notifyWatch from './transforms/notifyWatch';
import transcriptHandler from './endpoints/transcriptHandler';
import evaluationsHandler from './endpoints/evaluationsHandler';

const serviceAccount = require('../service-account.json');

admin.initializeApp(
  Object.assign({}, functions.config().firebase, {
    credential: admin.credential.cert(serviceAccount),
  }),
);

const app = express();

app.use(cors());
app.use(compression());

// Parse authentication headers if available.
app.use((req, res, next) => {
  const authorization = req.get('authorization');
  if (authorization) {
    const credentials = new Buffer(authorization.split(' ').pop(), 'base64')
      .toString('ascii')
      .split(':');
    req['username'] = credentials[0];
    req['password'] = credentials[1];
  }
  next();
});

app.disable('X-Powered-By');

app.all('/evaluations/:id', evaluationsHandler);
app.all('/transcript', transcriptHandler);
app.all('/grades', (req, res, next) => {
  admin
    .firestore()
    .collection('institutions')
    .doc('uchicago')
    .collection('grades')
    .get()
    .then(snapshot => {
      const results = {};
      snapshot.forEach(doc => {
        const { course, gpa } = doc.data();
        if (!results[course]) {
          results[course] = {};
        }
        if (gpa) {
          // Ignore failing grades bc watever.
          results[course][gpa] = (results[course][gpa] || 0) + 1;
        }
      });
      res.status(200);
      res.json(results);
    });
});

// Create an error handler.
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (res.statusCode === 200) {
    res.statusMessage = err.message || err;
    res.status(400);
  }
  res.json({ error: err.message || err });
});

export const api = functions.https.onRequest(app);
export const grades = functions.pubsub.topic('grades').onPublish(event => {
  const { chicagoId, record } = event.data.json;
  const basis = [record['term'], record['course'], record['section']].join();
  const key = crypto
    .pbkdf2Sync(basis, chicagoId, 2000000, 20, 'sha512')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return admin
    .firestore()
    .collection('institutions')
    .doc('uchicago')
    .collection('grades')
    .doc(key)
    .set({
      course: record['course'],
      section: record['section'],
      term: record['term'],
      gpa: record['gpa'],
      tenure: record['tenure'],
    });
});

type Params = {
  course: string;
  term: string;
  section: string;
};

const SECTION_PATH =
  'institutions/uchicago/courses/{course}/terms/{term}/sections/{section}';
export const watches = functions.firestore
  .document(SECTION_PATH)
  .onWrite(event => {
    notifyWatch(
      event.params as Params,
      event.data.previous.data(),
      event.data.data(),
    );
  });
