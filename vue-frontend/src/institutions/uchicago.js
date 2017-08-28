import firebase from 'firebase';
import axios from 'axios';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/fromEventPattern';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/combineLatest';
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
  let cache = f.length ? new Map() : null;
  return key => {
    if (f.length && cache.has(key)) {
      return cache.get(key);
    } else if (!f.length && cache) {
      return cache;
    }
    const result = f(key);
    if (f.length) {
      cache.set(key, result);
    } else {
      cache = result;
    }
    return result;
  };
}

const val = memoize(path => {
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

const courses = val('/indexes/all');
const terms = val('/indexes/terms');
const periods = val('/indexes/periods');
// This pulls for all courses because the number of grades is used for search ranking.
const gradeDistribution = Observable.defer(() =>
  axios.get(CLOUD_FUNCTIONS + '/api/grades'),
)
  .map(response => Object.freeze(response.data))
  .publishReplay(1)
  .refCount();

const UCHICAGO = {
  name: 'University of Chicago',
  /** eg Semester, Quarter, Term */
  periodName: 'Quarter',
  periods: [
    { name: 'Autumn', shorthand: 'A', color: '#ffc107' },
    { name: 'Winter', shorthand: 'W', color: '#2196f3' },
    { name: 'Spring', shorthand: 'S', color: '#4caf50' },
    { name: 'Summer', shorthand: 'S', color: '#ff5252' },
  ],
  scheduleBlocks: {
    morning: [8 * 60, 10 * 60 + 30],
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
    courseInfo(id) {
      return val('/course-info/' + id);
    },
    schedules(id, term) {
      const year = UCHICAGO.converters.termToYear(term);
      const period = UCHICAGO.converters.termToPeriod(term).name;
      return val('/schedules/' + id + '/' + year + '/' + period).map(
        arrayToObject,
      );
    },
    departments() {
      return val('/indexes/departments').map(value => Object.keys(value));
    },
    instructors() {
      return val('/indexes/instructors').map(value => Object.keys(value));
    },
    scheduleIndex(intervalTree) {
      return val('/indexes/schedules').map(schedules => {
        // Return a subsetter that will filter to any classes
        // that match any schedule set.
        return Object.entries(schedules)
          .map(([key, subset]) => [
            key
              .split(',')
              .map(interval =>
                interval.split('-').map(time => parseInt(time, 10)),
              ),
            subset,
          ])
          .filter(([schedule, subset]) => {
            return schedule.every(s => intervalTree.intersects(s));
          })
          .reduce((a, [schedule, subset]) => a.concat(subset), []);
      });
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
      return val('/indexes/offerings/' + id).map(offerings =>
        offerings.sort(
          (a, b) =>
            UCHICAGO.converters.termToOrdinal(b) -
            UCHICAGO.converters.termToOrdinal(a),
        ),
      );
    },
    description(id) {
      return val('/course-descriptions/' + id);
    },
    crosslists(id) {
      return val('/course-info/' + id).map(x => x.crosslists || []);
    },
    query(term) {
      return val('/indexes/fulltext/' + term);
    },
    courseRanking() {
      return gradeDistribution
        .map(distribution => {
          return Object.entries(distribution).reduce((obj, [course, data]) => {
            obj[course] = 2 * Object.values(data).reduce((a, b) => a + b);
            return obj;
          }, {});
        })
        .combineLatest(val('/indexes/sequences'), (courseRanking, sequence) => {
          Object.values(sequence).forEach(sequence => {
            // Promote the rank of each course in the sequence to the max.
            const max =
              sequence
                .map(course => courseRanking[course])
                .reduce((a, b) => Math.max(a, b)) + 1;
            sequence.forEach(course => (courseRanking[course] = max));
          });
          return courseRanking;
        })
        .publishReplay(1)
        .refCount();
    },
    sequences() {
      return val('/indexes/sequences');
    },
    search(filter$) {
      const filterAny = (filter, dataset) => {
        return dataset.map(dataset => {
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
              .map(matches => new Set(matches))
              .map(matches => results => results.filter(c => matches.has(c)));
          });
        }
        if (filter.departments.length) {
          yield filterAny(filter.departments, val('/indexes/departments'));
        }
        if (filter.instructors.length) {
          yield filterAny(filter.instructors, val('/indexes/instructors'));
        }
        yield filterAny(
          filter.periods
            .map(i => UCHICAGO.periods[i])
            .filter(Boolean)
            .map(period => period.name),
          periods,
        );
        if (filter.days.length < 7) {
          // This is a rather expensive filter...
          yield UCHICAGO.endpoints
            .scheduleIndex(
              filter.days.map(day => [1440 * day, 1440 * (day + 1)]),
            )
            .map(subset =>
              subset.map(course => course.substring(0, course.indexOf('/'))),
            )
            .map(courses => new Set(courses))
            .map(courses => {
              return results => results.filter(course => courses.has(course));
            });
        }
      }
      const subsetters = filter$.switchMap(filter =>
        Observable.forkJoin(
          [...generateSubsetters(filter)].map(x => x.first()),
        ),
      );
      return subsetters
        .combineLatest(courses)
        .take(1)
        .concat(subsetters.skip(1).withLatestFrom(courses))
        .map(([subsetters, results]) => {
          return subsetters.reduce((results, sub) => sub(results), results);
        });
    },
    serverTimeOffset() {
      return val('.info/serverTimeOffset');
    },
    watches: {
      create(value) {
        db.ref('watches').child(firebaseAuth.currentUser.uid).push().set(
          Object.assign(value, {
            created: firebase.database.ServerValue.TIMESTAMP,
          }),
        );
      },
      update(key, value) {
        db
          .ref('watches')
          .child(firebaseAuth.currentUser.uid)
          .child(key)
          .set(value);
      },
      read: memoize(() => {
        return Observable.create(obs => firebaseAuth.onAuthStateChanged(obs))
          .switchMap(user => user && val('watches/' + user.uid))
          .map(val => (val ? Object.values(val) : []))
          .map(Object.freeze);
      }),
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
