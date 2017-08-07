import firebase from 'firebase';
import axios from 'axios';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEventPattern';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/publishReplay';

const app = firebase.initializeApp(
  {
    apiKey: 'AIzaSyCjBDyhwbXcp9kEIA2pMHLDGxmCM4Sn6Eg',
    authDomain: 'canigraduate-43286.firebaseapp.com',
    databaseURL: 'https://canigraduate-43286.firebaseio.com',
    storageBucket: 'canigraduate-43286.appspot.com',
    messagingSenderId: '916201625926',
  },
  'uchicago',
);
const db = app.database();

function ref(path) {
  return Observable.fromEventPattern(
    handler => db.ref(path).on('value', handler),
    handler => db.ref(path).off('value', handler),
  )
    .map(snapshot => snapshot.val())
    .publishReplay(1)
    .refCount();
}

function memoize(f) {
  const cache = new Map();
  return key => {
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = f(key);
    cache.set(key, result);
    return result;
  };
}

const departments = ref('/indexes/departments');
const instructors = ref('/indexes/instructors');
const courses = ref('/indexes/all');
const terms = ref('/indexes/terms');
const courseName = new Map();
const offerings = new Map();
const crosslists = new Map();

const UCHICAGO = {
  name: 'University of Chicago',
  periodName: 'Quarter',
  periods: [
    { name: 'Autumn', shorthand: 'F', color: '#ffc107' },
    { name: 'Winter', shorthand: 'W', color: '#2196f3' },
    { name: 'Spring', shorthand: 'S', color: '#4caf50' },
    { name: 'Summer', shorthand: 'S', color: '#ff5252' },
  ],
  searchPlaceholder: 'Math 15300',
  endpoints: {
    transcript(auth) {
      return Observable.fromPromise(
        axios.get(
          'https://us-central1-canigraduate-43286.cloudfunctions.net/api/transcript',
          { auth },
        ),
      ).flatMap(response =>
        app
          .auth()
          .signInWithCustomToken(response.data.token)
          .then(() => response),
      );
    },
    courseName: memoize(id => ref('/course-info/' + id + '/name')),
    departments() {
      return departments.map(value => Object.keys(value));
    },
    instructors() {
      return instructors.map(value => Object.keys(value));
    },
    terms() {
      return terms
        .map(value => Object.keys(value))
        .map(terms =>
          terms.sort(
            (a, b) =>
              UCHICAGO.converters.termToOrdinal(b) -
              UCHICAGO.converters.termToOrdinal(a),
          ),
        );
    },
    courses() {
      return courses;
    },
    offerings: memoize(id => {
      return ref('/indexes/offerings/' + id).map(offerings =>
        offerings.sort(
          (a, b) =>
            UCHICAGO.converters.termToOrdinal(b) -
            UCHICAGO.converters.termToOrdinal(a),
        ),
      );
    }),
    description: memoize(id => ref('/course-descriptions/' + id)),
    crosslists: memoize(id =>
      ref('/course-info/' + id + '/crosslists').map(x => x || []),
    ),
    search(filter) {
      return UCHICAGO.endpoints.courses().first();
    },
    watches: {
      create(attrs) {},
    },
  },
  converters: {
    termToPeriod(term) {
      return UCHICAGO.periods.find(period => term.startsWith(period.name));
    },
    termToYear(term) {
      return parseInt(term.substring(7, 11), 10);
    },
    termToOrdinal(term) {
      const index = UCHICAGO.periods.findIndex(period =>
        term.startsWith(period.name),
      );
      const year = parseInt(term.substring(term.length - 4), 10) * 4;
      return index + year;
    },
  },
};

export default UCHICAGO;
