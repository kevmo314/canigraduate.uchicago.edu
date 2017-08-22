import firebase from 'firebase';
import axios from 'axios';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/fromEventPattern';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/publishReplay';

const CLOUD_FUNCTIONS =
  'https://us-central1-canigraduate-43286.cloudfunctions.net';

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
const firebaseAuth = app.auth();

/** Mitigates Firebase's array heuristic */
function arrayToObject(array) {
  if (!Array.isArray(array)) {
    return array;
  }
  return array.reduce((state, value, key) => {
    if (value) {
      state[key] = value;
    }
    return state;
  }, {});
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

const ref = memoize(path => {
  let first = true;
  return Observable.create(
    observer => {
      const callback = data => {
        first = false;
        observer.next(data);
      };
      const event = first ? 'value' : 'child_changed';
      db.ref(path).on(event, callback, error => observer.error(error));
      return { event, callback };
    },
    (handler, { event, callback }) => {
      db.ref(path).off(event, callback);
    },
  )
    .map(snapshot => snapshot.val())
    .publishReplay(1)
    .refCount();
});

const departments = ref('/indexes/departments');
const instructors = ref('/indexes/instructors');
const courses = ref('/indexes/all');
const terms = ref('/indexes/terms');
const periods = ref('/indexes/periods');
// This pulls for all courses because the number of grades is used for search ranking.
const gradeDistribution = Observable.defer(() =>
  axios.get(CLOUD_FUNCTIONS + '/api/grades'),
)
  .map(response => Object.freeze(response.data))
  .publishReplay()
  .refCount();
const courseName = new Map();
const offerings = new Map();
const crosslists = new Map();

const UCHICAGO = {
  name: 'University of Chicago',
  /** eg Semester, Quarter, Term */
  periodName: 'Quarter',
  periods: [
    { name: 'Autumn', shorthand: 'F', color: '#ffc107' },
    { name: 'Winter', shorthand: 'W', color: '#2196f3' },
    { name: 'Spring', shorthand: 'S', color: '#4caf50' },
    { name: 'Summer', shorthand: 'S', color: '#ff5252' },
  ],
  scheduleBlocks: {
    morning: [8 * 60 + 30, 10 * 60 + 30],
    noon: [10 * 60 + 30, 13 * 60 + 30],
    afternoon: [13 * 60 + 30, 16 * 60 + 30],
    evening: [16 * 60 + 30, 19 * 60 + 30],
  },
  /** The set of valid GPAs that can be issued by the institution in ascending order. */
  gpas: [0.0, 1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0],
  /** Used in the search bar, usually a canonical course that all students are familiar with. */
  searchPlaceholder: 'Math 15300',
  emailDomain: '@uchicago.edu',
  endpoints: {
    transcript(auth) {
      return Observable.fromPromise(
        axios.get(CLOUD_FUNCTIONS + '/api/transcript', { auth }),
      ).flatMap(response =>
        firebaseAuth.signInWithCustomToken(response.data.token).then(() => {
          response.data.data = {
            displayName: firebaseAuth.currentUser.displayName,
            email: firebaseAuth.currentUser.email,
          };
          return response;
        }),
      );
    },
    signOut() {
      firebaseAuth.signOut();
    },
    gradeDistribution() {
      return gradeDistribution;
    },
    courseName(id) {
      return ref('/course-info/' + id + '/name');
    },
    schedules(id, term) {
      const year = UCHICAGO.converters.termToYear(term);
      const period = UCHICAGO.converters.termToPeriod(term).name;
      return ref('/schedules/' + id + '/' + year + '/' + period).map(
        arrayToObject,
      );
    },
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
    offerings(id) {
      return ref('/indexes/offerings/' + id).map(offerings =>
        offerings.sort(
          (a, b) =>
            UCHICAGO.converters.termToOrdinal(b) -
            UCHICAGO.converters.termToOrdinal(a),
        ),
      );
    },
    description(id) {
      return ref('/course-descriptions/' + id);
    },
    crosslists(id) {
      return ref('/course-info/' + id + '/crosslists').map(x => x || []);
    },
    query(term) {
      return ref('/indexes/fulltext/' + term);
    },
    search(filter$) {
      const filterAny = (filter, dataset) => {
        return dataset.first().map(dataset => {
          dataset = filter.map(key => new Set(dataset[key]));
          return results =>
            results.filter(course => dataset.some(data => data.has(course)));
        });
      };
      function* generateSubsetters(filter) {
        if (filter.query) {
          yield* filter.query.split(' ').filter(x => x.length).map(token => {
            return UCHICAGO.endpoints
              .query(token.toLowerCase())
              .first()
              .map(matches => new Set(matches))
              .map(matches => results => results.filter(c => matches.has(c)));
          });
        }
        if (filter.departments.length) {
          yield filterAny(filter.departments, departments);
        }
        if (filter.instructors.length) {
          yield filterAny(filter.instructors, instructors);
        }
        yield filterAny(
          filter.periods
            .map(i => UCHICAGO.periods[i])
            .filter(Boolean)
            .map(period => period.name),
          periods,
        );
      }
      const subsetters = filter$.flatMap(filter =>
        Observable.forkJoin(...generateSubsetters(filter)),
      );
      return Observable.combineLatest(subsetters, courses)
        .take(1)
        .concat(subsetters.skip(1).withLatestFrom(courses))
        .map(([subsetters, results]) => {
          return subsetters.reduce((results, sub) => sub(results), results);
        });
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
      return (index + 3) % 4 + year;
    },
  },
};

export default UCHICAGO;
