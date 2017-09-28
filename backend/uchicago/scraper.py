import bitarray
import base64
import collections
import datetime
import json
import math
import multiprocessing
import os
import binascii
import zlib
import pickle
import re
import requests
import sqlite3

import pyrebase

from src import Term
from src import CollegeCatalogParser
from src import RibbitParser

ALPHANUMERIC = re.compile('[^a-z0-9 ]+')
FIREBASE = pyrebase.initialize_app({
    'apiKey':
    'AIzaSyCjBDyhwbXcp9kEIA2pMHLDGxmCM4Sn6Eg',
    'authDomain':
    'canigraduate-43286.firebaseapp.com',
    'databaseURL':
    'https://canigraduate-43286.firebaseio.com',
    'storageBucket':
    'canigraduate-43286.appspot.com',
    'serviceAccount':
    './service_account_key.json'
})
MIDNIGHT = datetime.datetime.strptime('12:00AM', '%I:%M%p')


def transform(a):
    if isinstance(a, list):
        return {i: j for i, j in enumerate(a) if j is not None}
    return a


def get_words(text):
    return set(ALPHANUMERIC.sub('', text.lower()).split())


def parse_schedule(schedule):
    separates = [x.strip() for x in schedule.split('&')]
    if len(separates) > 1:
        results = []
        for s in separates:
            results.extend(parse_schedule(s))
        return results
    if schedule == 'TBA':
        return []
    components = [x.strip() for x in schedule.split(':', 1)]
    times = [x.strip() for x in components[-1].split('-')]
    if not times[0] or not times[1]:
        return []
    from_time = int(
        (datetime.datetime.strptime(times[0], '%I:%M %p') - MIDNIGHT
         ).total_seconds() / 60)
    to_time = int((datetime.datetime.strptime(times[1], '%I:%M %p') - MIDNIGHT
                   ).total_seconds() / 60)
    days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    result = []
    for offset, day in enumerate(days):
        if day in components[0]:
            result.append(
                [offset * 24 * 60 + from_time, offset * 24 * 60 + to_time])
    return result


def scrub_data(db):
    updates = {}
    course_info = db.child('course-info').get().val()
    for course, info in course_info.items():
        updates['course-info/%s/crosslists' % course] = list(
            filter(lambda x: len(x) == 10, info.get('crosslists', [])))
    db.update(updates)


def iterate_schedules(schedules):
    for course_id, a in schedules.items():
        for year, b in a.items():
            for period, c in b.items():
                yield (course_id, year, period, transform(c))


def firebase_cached_read(db, child):
    try:
        with open(child + '.pkl', 'rb') as f:
            data = pickle.load(f)
    except IOError:
        data = db.child(child).get().val()
        with open(child + '.pkl', 'wb') as f:
            pickle.dump(data, f)
    return data


# There are three types of indices:
# - Course-based whitelist
#   The ith bit indicates that the ith course is in this set.
# - Term-based whitelist
#   The (i % len)th bit indicates that the ith term is in this set.
# - Activity-based whitelist
#   A multidimensional, jagged array is flattened with the outermost dimension
#   representing the term, the next dimension representing the course, the next
#   dimension representing the section index, and the innermost dimension
#   representing the activity index. The resultant bit indicates inclusion in the
#   set.
#
# Index keys are provided to calculate offsets. Each (term, course) pair holds
# a length indicating the size of its activity allocation.
def rebuild_indexes(db):
    schedules = firebase_cached_read(db, 'schedules')
    course_info = firebase_cached_read(db, 'course-info')
    course_descriptions = firebase_cached_read(db, 'course-descriptions')

    cardinalities = {}
    terms = set()

    for (course_id, year, period, course) in iterate_schedules(schedules):
        term = Term('%s %s' % (period, year))
        terms.add(term)
        cardinality = sum(
            max(1, len(section.get('secondaries', {})))
            for section in course.values())
        cardinalities[(term, course_id)] = cardinality

    def init(size):
        b = bitarray.bitarray(size)
        b.setall(False)
        return b

    # Construct the indices.
    periods = collections.defaultdict(lambda: init(len(terms)))
    departments = collections.defaultdict(lambda: init(len(schedules)))
    inverted = collections.defaultdict(lambda: init(len(schedules)))
    sequences = collections.defaultdict(lambda: init(len(schedules)))
    instructors = collections.defaultdict(
        lambda: init(sum(cardinalities.values())))
    times = collections.defaultdict(lambda: init(sum(cardinalities.values())))

    # Construct the coarse indices.
    for index, term in enumerate(sorted(terms)):
        year = term.id[-4:]
        period = term.id[:6]
        periods[period][index] = True

    for index, course_id in enumerate(sorted(schedules.keys())):
        departments[course_id[:4]][index] = True
        name = course_info.get(course_id, {}).get('name', '')
        desc = course_descriptions.get(course_id, {}).get('description', '')
        for word in get_words(course_id) | get_words(name) | get_words(desc):
            inverted[word][index] = True
        sequence = course_info.get(course_id, {}).get('sequence')
        if sequence:
            sequences[sequence][index] = True

    # Construct the fine indices.
    def serialize_schedule(schedule):
        return ','.join(
            ['-'.join(str(x) for x in s) for s in sorted(schedule)])

    index = 0
    for course_id in sorted(schedules.keys()):
        print(course_id)
        for term in sorted(terms):
            if (term, course_id) not in cardinalities:
                continue
            year = term.id[-4:]
            period = term.id[:6]
            course = transform(schedules[course_id][year][period])

            for primary_id in sorted(course.keys()):
                primary_instructors = []
                primary_schedules = []
                for primary in course[primary_id]['primaries']:
                    primary_instructors.extend(primary.get('instructors', []))
                    primary_schedules.extend(primary.get('schedule', []))
                secondaries = transform(
                    course[primary_id].get('secondaries', {}))
                for secondary_id in sorted(secondaries.keys()):
                    activity = course[primary_id]['secondaries'][secondary_id]
                    secondary_instructors = activity.get('instructors', [])
                    secondary_schedules = activity.get('schedule', [])
                    for instructor in primary_instructors + secondary_instructors:
                        instructors[instructor.replace('.', '')][index] = True
                    times[serialize_schedule(primary_schedules +
                                             secondary_schedules)
                          or 'unknown'][index] = True
                    index += 1
                if not course[primary_id].get('secondaries', {}):
                    for instructor in primary_instructors:
                        instructors[instructor.replace('.', '')][index] = True
                    times[serialize_schedule(primary_schedules)
                          or 'unknown'][index] = True
                    index += 1
    # Quick sanity check.
    assert index == sum(cardinalities.values())

    if os.path.isfile('cache.db'):
        records = []
        for (term, course_id) in cardinalities:
            year = term.id[-4:]
            period = term.id[:6]
            records.append((course_id, int(year), period, course_id[:4],
                            json.dumps(schedules[course_id][year][period])))
        cache = sqlite3.connect('cache.db')
        cursor = cache.cursor()
        cursor.execute('DELETE FROM courses')
        cursor.executemany(
            'INSERT INTO courses (course, year, period, department, record) VALUES (?, ?, ?, ?, ?)',
            records)
        cache.commit()
        cache.close()

    def pack(d):
        return base64.b64encode(
            zlib.compress(json.dumps(list(d)).encode('utf-8'), 9)).decode()

    def compress(d):
        def pick(v):
            sparse = [i for i, x in enumerate(v.tolist()) if x]
            if len(sparse) < 128:
                return json.dumps([v.length()] + sparse)
            return base64.b64encode(zlib.compress(v.tobytes(), 9)).decode()

        return {k: pick(v) for k, v in d.items()}

    data = bytearray()
    for course in sorted(schedules.keys()):
        for term in sorted(terms):
            cardinality = cardinalities.get((term, course), 0)
            data.append((cardinality >> 0) & 0xFF)
            data.append((cardinality >> 8) & 0xFF)
    data = base64.b64encode(zlib.compress(data, 9)).decode()

    # Certain courses do not have any schedule records. These are omitted from the
    # reference tables to save space (as they'll always match 0), and instead manually
    # added by the filtering algorithm when relevant.
    orphans = set(schedules.keys()) - set(course_info.keys())

    db.child('indexes').set({
        'fulltext': compress(inverted),
        'instructors': compress(instructors),
        'departments': compress(departments),
        'periods': compress(periods),
        'schedules': compress(times),
        'sequences': compress(sequences),
        # Reference tables.
        'cardinalities': data,
        'terms': pack(map(lambda t: t.id, sorted(terms))),
        'courses': pack(sorted(schedules.keys())),
        'orphans': pack(sorted(orphans))
    })


def scrape_descriptions(db):
    course_info = db.child('course-info').get().val()
    courses, sequences = CollegeCatalogParser()
    updates = {}
    for course, data in courses.items():
        updates['course-descriptions/' + course] = {
            'description': data['description'],
            'notes': data['notes']
        }
        # The catalog is a more authoritative source.
        updates['course-info/' + course + '/name'] = data['name']
        updates['course-info/' + course + '/sequence'] = data['sequence']
    for sequence, data in sequences.items():
        updates['sequence-descriptions/' + sequence] = {
            'description': data['description'],
            'notes': data['notes']
        }
        updates['sequence-info/' + sequence + '/name'] = data['name']
    db.update(updates)
    if False:  # Ribbit updates.
        updates = {}
        course_descriptions = db.child('course-descriptions').get().val()
        find = [
            course for course in course_info.keys()
            if course not in course_descriptions
        ]
        print('Found', len(find), 'dangling courses')
        for course, data in RibbitParser(find).items():
            updates['course-info/' + course + '/name'] = data.name
            if data.description:
                updates['course-descriptions/'
                        + course + '/description'] = data.description
        if updates:
            db.update(updates)


def scrape_data(db):
    terms = sorted(list(Term.all()))
    index = 0
    known_course_info = db.child('course-info').get().val()
    course_descriptions = db.child('course-descriptions').get().val()
    while terms:
        term = terms.pop()
        if term.id != 'Autumn 2016':
            print('Skipping ', term.id)
            continue
        index += 1
        updates = {}
        for course, sections in term.courses.items():
            data = known_course_info.get(course.id, {'crosslists': []})
            for id, section in sections.items():
                if data.get('name', section.name) != section.name:
                    print('[%s] Conflicting course name for %s: %s, %s' %
                          (term, course.id, data, section.name))
                data['name'] = section.name
                data['crosslists'] = list(
                    set(data.get('crosslists', [])) | set(section.crosslists))
                try:
                    data['crosslists'].remove(course.id)
                except:
                    pass
                year = term.id[-4:]
                period = term.id[:6]
                update = {
                    'term':
                    '%s %s' % (period, year),
                    'department':
                    course.id[:4],
                    'prerequisites':
                    section.prerequisites,
                    'notes':
                    section.notes,
                    'enrollment':
                    section.enrollment,
                    'primaries': [{
                        'instructors': primary.instructors,
                        'schedule': primary.schedule,
                        'type': primary.type,
                        'location': primary.location
                    } for primary in section.primaries],
                    'secondaries':
                    dict([(secondary.id, {
                        'instructors': secondary.instructors,
                        'schedule': secondary.schedule,
                        'type': secondary.type,
                        'enrollment': secondary.enrollment
                    }) for secondary in section.secondaries])
                }
                updates['schedules/%s/%s/%s/%s' % (course.id, year, period,
                                                   id)] = update
            known_course_info[course.id] = data
            updates['course-info/%s' % course.id] = data
        try:
            db.update(updates)
        except:
            print(updates)
            raise
        if not updates:
            terms.insert(0, term)
        print(term, '%d updates' % len(updates))


if __name__ == '__main__':
    db = FIREBASE.database()
    # db.child('schedules').set({})
    # scrape_data(db)
    # scrape_descriptions(db)
    rebuild_indexes(db)
