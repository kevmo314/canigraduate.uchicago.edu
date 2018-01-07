import firebase from 'firebase';
import axios from 'axios';
import pako from 'pako';
import munkres from '@/lib/munkres';
import TypedFastBitSet from 'fastbitset';
import withLatestFromBlocking from '@/lib/with-latest-from-blocking';
import binarySearch from '@/lib/binary-search';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/fromEventPattern';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/let';
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

const cardinalities = val('/indexes/cardinalities')
  .map(data => new Uint16Array(pako.inflate(window.atob(data)).buffer))
  // Cardinalities are stored as 16-bit integers.
  .map(data => {
    const isBigEndian = new Uint16Array(new Uint8Array([0, 1]).buffer)[0] == 1;
    // TODO: Probably report some telemetry on what fraction of users are actually on big endian systems.
    return isBigEndian
      ? data.map(x => (x & (0xff00 >> 8)) | (x & (0x00ff << 8)))
      : data;
  })
  .publishReplay(1)
  .refCount();

const packedIndex = memoize(path => {
  const subject = new ReplaySubject(1);
  val('/indexes/' + path)
    .map(data => {
      return data
        ? JSON.parse(pako.inflate(window.atob(data), { to: 'string' }))
        : null;
    })
    .subscribe(subject);
  return subject;
});

function cdf(array) {
  const result = new Uint32Array(array.length + 1);
  for (let i = 1; i < result.length; i++) {
    result[i] += array[i - 1] + result[i - 1];
  }
  return result;
}

const courseTermOffsets = cardinalities
  .map(cdf)
  .publishReplay(1)
  .refCount();

const courseOffsets = cardinalities
  .combineLatest(packedIndex('terms'), (data, terms) => {
    const result = new Uint32Array(data.length / terms.length);
    for (let i = 0; i < data.length; i++) {
      result[(i / terms.length) | 0] += data[i];
    }
    return cdf(result);
  })
  .publishReplay(1)
  .refCount();

function decompress(data, cardinalities, courseTermOffsets, courses, terms) {
  const result = new TypedFastBitSet();
  const totalCardinality = courseTermOffsets[courseTermOffsets.length - 1];
  if (data instanceof Uint8Array) {
    const length = data.length;
    result.resize(length);
    let index = 0;
    if (
      length == Math.ceil(courses.length / 8) ||
      length == Math.ceil(terms.length / 8)
    ) {
      const useCourseIndex = length == Math.ceil(courses.length / 8);
      for (let i = 0; i < courses.length; i++) {
        for (let j = 0; j < terms.length; j++) {
          const dataIndex = useCourseIndex ? i : j;
          if ((data[(dataIndex / 8) | 0] >> (7 - dataIndex % 8)) & 1) {
            for (let k = 0; k < cardinalities[i * terms.length + j]; k++) {
              result.add(index++);
            }
          } else {
            index += cardinalities[i * terms.length + j];
          }
        }
      }
    } else if (length == Math.ceil(totalCardinality / 8)) {
      for (let i = 0; i < totalCardinality; i++) {
        if ((data[(i / 8) | 0] >> (7 - i % 8)) & 1) {
          result.add(i);
        }
      }
    } else {
      throw new Error('Invalid data length: ' + length);
    }
  } else {
    const length = Math.ceil(data.shift() / 8);
    result.resize(length);
    if (length == Math.ceil(courses.length / 8)) {
      data.forEach(i => {
        for (let j = 0; j < terms.length; j++) {
          for (let k = 0; k < cardinalities[i * terms.length + j]; k++) {
            result.add(courseTermOffsets[i * terms.length + j] + k);
          }
        }
      });
    } else if (length == Math.ceil(terms.length / 8)) {
      for (let i = 0; i < courses.length; i++) {
        data.forEach(j => {
          for (let k = 0; k < cardinalities[i * terms.length + j]; k++) {
            result.add(courseTermOffsets[i * terms.length + j] + k);
          }
        });
      }
    } else if (length == Math.ceil(totalCardinality / 8)) {
      data.forEach(i => result.add(i));
    } else {
      throw new Error('Invalid data length: ' + length);
    }
  }
  return result;
}

const compressedIndex = memoize(path => {
  const subject = new ReplaySubject(1);
  val('/indexes/' + path)
    .map(data => {
      if (!data) {
        return data;
      }
      try {
        return JSON.parse(data);
      } catch (e) {
        return pako.inflate(window.atob(data));
      }
    })
    .let(
      withLatestFromBlocking(
        cardinalities,
        courseTermOffsets,
        packedIndex('courses'),
        packedIndex('terms'),
      ),
    )
    .map(([data, cardinalities, courseTermOffsets, courses, terms]) => {
      if (!data) {
        return data;
      }
      return decompress(data, cardinalities, courseTermOffsets, courses, terms);
    })
    .subscribe(subject);
  return subject;
});

const scheduleIndex = memoize(() => {
  const subject = new ReplaySubject(1);
  val('/indexes/schedules')
    .map(data => {
      return Object.keys(data).reduce((state, key) => {
        try {
          state[key] = JSON.parse(data[key]);
        } catch (e) {
          state[key] = pako.inflate(window.atob(data[key]));
        }
        return state;
      }, {});
    })
    .let(
      withLatestFromBlocking(
        cardinalities,
        courseOffsets,
        packedIndex('courses'),
        packedIndex('terms'),
      ),
    )
    .map(([schedules, cardinalities, offsets, courses, terms]) => {
      // Return a subsetter that will filter to any classes
      // that match any schedule set.
      return Object.entries(schedules).map(([key, subset]) => {
        const bitset = decompress(
          subset,
          cardinalities,
          offsets,
          courses,
          terms,
        );
        return [key, bitset.array()];
      });
    })
    .subscribe(subject);
  return subject;
});

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
  searchPlaceholder: 'Foucault',
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
    educatorSignIn(username, password) {
      return Observable.fromPromise(
        firebaseAuth.signInWithEmailAndPassword(username, password),
      ).map(response => {
        response.data = {
          success: "you're logged in",
        };
        return response;
      });
    },
    // TODO: add checking if email is verified
    // TODO: check if using @edu address
    createEducatorAccount(username, password) {
      return Observable.fromPromise(
        firebaseAuth
          .createUserWithEmailAndPassword(username, password)
          .then(user => {
            user.sendEmailVerification();
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
    departments() {
      return val('/indexes/departments').map(value => Object.keys(value));
    },
    instructors() {
      return val('/indexes/instructors').map(value => Object.keys(value));
    },
    terms() {
      return packedIndex('terms').map(terms =>
        [...terms].sort(
          (a, b) =>
            UCHICAGO.converters.termToOrdinal(b) -
            UCHICAGO.converters.termToOrdinal(a),
        ),
      );
    },
    courses() {
      return packedIndex('courses');
    },
    description(id) {
      return val('/course-descriptions/' + id);
    },
    crosslists(id) {
      return val('/course-info/' + id).map(x => x.crosslists || []);
    },
    courseRanking() {
      return gradeDistribution
        .map(distribution => {
          return Object.entries(distribution).reduce((obj, [course, data]) => {
            return Object.assign(obj, {
              [course]: 2 * Object.values(data).reduce((a, b) => a + b),
            });
          }, {});
        })
        .combineLatest(
          UCHICAGO.endpoints.sequences(),
          (courseRanking, sequences) => {
            Object.values(sequences).forEach(sequence => {
              // Promote the rank of each course in the sequence to the max.
              const max =
                sequence
                  .map(course => courseRanking[course] | 0)
                  .reduce((a, b) => Math.max(a, b)) + 1;
              sequence.forEach(course => (courseRanking[course] = max));
            });
            return courseRanking;
          },
        )
        .publishReplay(1)
        .refCount();
    },
    sequences() {
      return val('/indexes/sequences').combineLatest(
        packedIndex('courses'),
        (sequences, courses) => {
          return Object.keys(sequences).reduce((state, key) => {
            let data = null;
            try {
              data = JSON.parse(sequences[key]);
              data.shift(); // Drop the header value.
            } catch (e) {
              data = pako.inflate(window.atob(sequences[key]));
            }
            if (data instanceof Uint8Array) {
              state[key] = [];
              for (let i = 0; i < courses.length; i++) {
                if ((data[(i / 8) | 0] >> (7 - i % 8)) & 1) {
                  state[key].push(courses[i]);
                }
              }
            } else {
              state[key] = data.map(i => courses[i]);
            }
            return state;
          }, {});
        },
      );
    },
    search(filter$) {
      const filterAny = (filter, pathPrefix) => {
        if (filter.length == 0) {
          return Observable.of(results => new TypedFastBitSet());
        }
        return Observable.combineLatest(
          filter.map(key => compressedIndex(`${pathPrefix}/${key}`)),
        )
          .map(masks => {
            return masks.reduce((a, b) => a.union(b), new TypedFastBitSet());
          })
          .map(mask => results => results.intersection(mask));
      };
      function* generateSubsetters(filter) {
        if (filter.query) {
          yield* filter.query
            .split(' ')
            .filter(x => x.length)
            .map(token => token.toLowerCase())
            .map(token => {
              return compressedIndex(`fulltext/${token}`).map(mask => {
                return results => {
                  if (mask) {
                    return results.intersection(mask);
                  }
                  results.clear();
                  return results;
                };
              });
            });
        }
        if (filter.departments.length) {
          yield filterAny(filter.departments, 'departments');
        }
        if (filter.instructors.length) {
          yield filterAny(filter.instructors, 'instructors');
        }
        yield filterAny(
          filter.periods
            .map(i => UCHICAGO.periods[i])
            .filter(Boolean)
            .map(period => period.name),
          'periods',
        );

        // This is a rather expensive filter...
        if (filter.days) {
          yield scheduleIndex().map(schedules => {
            // Return a subsetter that will filter to any classes
            // that match any schedule set.
            const intersections = {};
            const mask = schedules
              .filter(([schedule, subset]) => {
                return schedule.split(',').reduce((state, interval) => {
                  if (!state) {
                    return false;
                  }
                  if (interval in intersections) {
                    return intersections[interval];
                  }
                  return (intersections[interval] = filter.days.intersects(
                    interval.split('-').map(t => parseInt(t, 10)),
                  ));
                }, true);
              })
              .reduce((a, [schedule, subset]) => {
                subset.forEach(i => a.add(i));
                return a;
              }, new TypedFastBitSet());
            return results => results.intersection(mask);
          });
        }
      }
      return courseOffsets
        .map(offsets => {
          const bitSet = new TypedFastBitSet();
          bitSet.resize(offsets[offsets.length - 1]);
          for (let i = 0; i < offsets[offsets.length - 1]; i++) {
            bitSet.add(i);
          }
          return bitSet;
        })
        .combineLatest(
          filter$.switchMap(filter =>
            Observable.forkJoin(
              [...generateSubsetters(filter)].map(x => x.first()),
            ),
          ),
          (state, subsetters) => {
            return subsetters.reduce((state, f) => f(state), state.clone());
          },
        )
        .let(
          withLatestFromBlocking(
            courseOffsets,
            packedIndex('courses'),
            packedIndex('terms'),
          ),
        )
        .map(([data, courseOffsets, courses, terms]) => {
          // Convert the bitset state to a proper result set.
          let lowerBound = 0;
          const results = [];
          data.forEach(index => {
            if (index < lowerBound) {
              return;
            }
            const location = binarySearch(courseOffsets, index);
            const courseIndex = location < 0 ? ~location - 1 : location;
            results.push(courses[courseIndex]);
            lowerBound = courseOffsets[courseIndex + 1];
          });
          return { courses: results, serialized: data };
        });
    },
    schedules(id, term, serialized = undefined) {
      const year = UCHICAGO.converters.termToYear(term);
      const period = UCHICAGO.converters.termToPeriod(term).name;
      if (!serialized) {
        return val(`/schedules/${id}/${year}/${period}`).map(arrayToObject);
      }
      // The serialized filter table has been provided.
      // Filter the schedules to the corresponding indices.
      return cardinalities.combineLatest(
        courseTermOffsets.combineLatest(
          packedIndex('courses'),
          packedIndex('terms'),
          (courseTermOffsets, courses, terms) => {
            return courseTermOffsets[
              courses.indexOf(id) * terms.length + terms.indexOf(term)
            ];
          },
        ),
        val(`/schedules/${id}/${year}/${period}`).map(arrayToObject),
        (cardinalities, index, schedules) => {
          // Create a schedule subset that contains the visible activities.
          const result = {};
          for (const sectionId of Object.keys(schedules).sort()) {
            const section = Object.assign({}, schedules[sectionId]);
            if (!section.secondaries || section.secondaries.length == 0) {
              if (serialized.has(index++)) {
                result[sectionId] = section;
              }
            } else {
              const secondaries = section.secondaries;
              section.secondaries = {};
              for (const activityId of Object.keys(secondaries).sort()) {
                if (serialized.has(index++)) {
                  section.secondaries[activityId] = secondaries[activityId];
                }
              }
              if (Object.keys(section.secondaries).length > 0) {
                result[sectionId] = section;
              }
            }
          }
          return result;
        },
      );
    },
    offerings(id, serialized) {
      return cardinalities.combineLatest(
        courseOffsets,
        packedIndex('courses'),
        packedIndex('terms'),
        (cardinalities, courseOffsets, courses, terms) => {
          const courseIndex = courses.indexOf(id);
          const offerings = [];
          if (courseIndex == -1) {
            return offerings;
          }
          let from = courseOffsets[courseIndex];
          for (let i = 0; i < terms.length; i++) {
            const to = from + cardinalities[courseIndex * terms.length + i];
            // Check if any bits between [from, to) are set.
            let matches = false;
            for (let j = from; j < to; j++) {
              if (serialized.has(j)) {
                matches = true;
                break;
              }
            }
            if (matches) {
              // Course was offered in this term.
              offerings.push(terms[i]);
            }
            from = to;
          }
          return offerings.reverse();
        },
      );
    },
    serverTimeOffset() {
      return val('.info/serverTimeOffset');
    },
    programs: memoize(() => {
      function display(node) {
        if (node.min && node.max) {
          if (node.min == node.max) {
            if (node.min > 1) {
              return 'Exactly ' + node.min + ' of the following';
            }
          } else {
            return (
              'At least ' +
              node.min +
              ' and at most ' +
              node.max +
              ' of the following'
            );
          }
        } else if (node.min && node.min > 1) {
          return 'At least ' + node.min + ' of the following';
        }
      }

      function grouping(node) {
        if (node.min == node.max && node.min == 1) {
          return 'OR';
        } else if (node.min && node.min == 1) {
          return 'OR';
        } else {
          return 'ALL';
        }
      }

      return val('/programs')
        .map(programs => {
          // Fold all the extensions into the parent.
          return Object.keys(programs).reduce((state, key) => {
            const extensions = programs[key].extensions || {};
            programs[key].extensions = {};
            return {
              ...state,
              [key]: programs[key],
              ...Object.entries(extensions).reduce(
                (state, [childKey, program]) => {
                  return { ...state, [`${key}/${childKey}`]: program };
                },
                {},
              ),
            };
          }, {});
        })
        .combineLatest(val('/sequences'), (programs, sequences) => {
          // Resolve the programs into their respective sequences, copying when necessary.
          return Object.keys(programs).reduce((state, key) => {
            const resolve = (state, path, i) =>
              i == path.length ? state : resolve(state[path[i]], path, i + 1);
            const parse = node => {
              if (typeof node == 'object' && !node.requirement) {
                if (!node.requirements) {
                  // Dangling node, just render it as-is.
                  return { ...node };
                }
                const requirements = Array.isArray(node.requirements)
                  ? node.requirements
                  : resolve(sequences, node.requirements.split('/'), 2);
                return {
                  display: display(node),
                  grouping: grouping(node),
                  // Default min and max.
                  min: requirements.length,
                  max: requirements.length,
                  ...node,
                  requirements: requirements.map(parse),
                };
              } else if (node.startsWith('/sequences')) {
                return {
                  collapse: true,
                  ...parse(resolve(sequences, node.split('/'), 2)),
                };
              } else if (!node.requirement) {
                // node is a non-sequence string, so evaluate explicitly.
                return { requirement: node };
              }
              return node;
            };
            return {
              ...state,
              // Copy the program's requirements node to resolve any references.
              [key]: parse(programs[key]),
            };
          }, {});
        })
        .map(programs => {
          function satisfies(specification, course) {
            if (specification.indexOf(':') === -1) {
              return course == specification;
            }
            // Just for convenience
            const parse = UCHICAGO.converters.courseToDepartmentAndOrdinal;
            return specification
              .split(':')[1]
              .split(',')
              .every(expression => {
                const [courseDepartment, courseOrdinal] = parse(course);
                if (expression.startsWith('>=')) {
                  const [department, ordinal] = parse(expression.substring(2));
                  return (
                    courseDepartment == department && courseOrdinal >= ordinal
                  );
                }
                if (expression.startsWith('>')) {
                  const [department, ordinal] = parse(expression.substring(1));
                  return (
                    courseDepartment == department && courseOrdinal > ordinal
                  );
                }
                if (expression.startsWith('<=')) {
                  const [department, ordinal] = parse(expression.substring(2));
                  return (
                    courseDepartment == department && courseOrdinal <= ordinal
                  );
                }
                if (expression.startsWith('<')) {
                  const [department, ordinal] = parse(expression.substring(1));
                  return (
                    courseDepartment == department && courseOrdinal < ordinal
                  );
                }
                if (expression.startsWith('!')) {
                  return expression.substring(1) != course;
                }
                throw new Error('Invalid expression "' + expression + '".');
              });
          }
          async function leafResolver(node, courses) {
            const i = courses.findIndex(c => satisfies(node.requirement, c));
            if (i > -1) {
              return {
                completed: 1,
                remaining: 0,
                satisfier: courses.splice(i, 1)[0],
              };
            }
            for (let i = 0; i < courses.length; i++) {
              const crosslists = await UCHICAGO.endpoints
                .crosslists(courses[i])
                .first()
                .toPromise();
              const success = crosslists.some(course =>
                satisfies(node.requirement, course),
              );
              if (success) {
                return {
                  completed: 1,
                  remaining: 0,
                  satisfier: courses.splice(i, 1)[0],
                };
              }
            }
            return { completed: 0, remaining: 1 };
          }
          async function nodeResolver(node, courses) {
            // The list of child progress objects.
            const progressions = [];
            let complete = 0;
            for (let i = 0; i < node.requirements.length; i++) {
              const child = (progressions[i] = await resolve(
                node.requirements[i],
                courses,
              ));
              if (!child.remaining && !child.completed) {
                // Remove any degenerate nodes that cannot count towards progress.
                continue;
              } else if (!child.remaining && ++complete == node.max) {
                // This child is completed, so stop iterating to prevent pulling unnecessary courses.
                // Technically future subtrees could cause unnecessarily taken courses to be marked,
                // but we'll just ignore that for now...
                break;
              }
            }
            // Sort by number of courses remaining ascending to catch the edge case of future subtrees being completed.
            const minimumRequirements = progressions
              .slice()
              .sort((a, b) => a.remaining - b.remaining)
              .slice(0, node.min);
            if (node.force) {
              progressions.remaining = 0;
            } else {
              progressions.remaining = minimumRequirements
                .map(progress => progress.remaining)
                .reduce((a, b) => a + b, 0);
            }
            progressions.completed = minimumRequirements
              .map(progress => progress.completed)
              .reduce((a, b) => a + b, 0);
            return progressions;
          }
          async function resolve(node, courses) {
            if (node.requirements) {
              return nodeResolver(node, courses);
            } else if (node.requirement) {
              return leafResolver(node, courses);
            }
            return { completed: 0, remaining: 0 };
          }
          // Add a resolver to each of the programs. Unfortunately, this has to happen outside the
          // requirement tree renderer because the order of evaluation matters.
          return Object.keys(programs).reduce((state, key) => {
            // Cache resolutions
            let resolutionTranscript = null;
            let result = null;
            return {
              ...state,
              [key]: {
                ...programs[key],
                // Create a generator that iterates over the solutions for the given courses list.
                async bindTranscript(transcript) {
                  if (resolutionTranscript == transcript) {
                    return result;
                  }
                  resolutionTranscript = transcript;
                  const courses = transcript.map(record => record.course);
                  return (result = resolve(programs[key], courses.slice()));
                },
              },
            };
          }, {});
        })
        .map(programs => {
          // Key the programs by their kebab-case string.
          return Object.keys(programs).reduce((state, key) => {
            return {
              ...state,
              [key.replace(/\s+/g, '-').toLowerCase()]: {
                ...programs[key],
                name: key.split('/').pop(),
              },
            };
          }, {});
        })
        .map(programs => {
          // Reattach any extensions to their parent program.
          return Object.keys(programs).reduce((state, key) => {
            if (key.indexOf('/') > -1) {
              const tokens = key.split('/');
              state[tokens[0]].extensions[tokens[1]] = programs[key];
            } else {
              state[key] = programs[key];
            }
            return state;
          }, {});
        })
        .publishReplay(1)
        .refCount();
    }),
    watches: {
      create(value) {
        db
          .ref('watches')
          .child(firebaseAuth.currentUser.uid)
          .push()
          .set(
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
          .switchMap(
            user => (user ? val('watches/' + user.uid) : Promise.resolve()),
          )
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
    courseToDepartmentAndOrdinal(course) {
      if (course.length != 10 || course.charAt(4) != ' ') {
        throw new Error('Invalid course string ' + course);
      }
      return [course.substring(0, 4), parseInt(course.substring(5), 10)];
    },
  },
};

export default UCHICAGO;