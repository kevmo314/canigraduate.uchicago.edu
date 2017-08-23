import collections
import datetime
import json
import re
import sqlite3

import pyrebase

from src import Term
from src import CollegeCatalogParser

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
    'backend/uchicago/service_account_key.json'
})
MIDNIGHT = datetime.datetime.strptime('12:00AM', '%I:%M%p')


def transform(a):
    return dict([(i, j) for i, j in enumerate(a) if j is not None])


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


def rebuild_indexes(db):
    schedules = db.child('schedules').get().val()
    course_info = db.child('course-info').get().val()
    course_descriptions = db.child('course-descriptions').get().val()
    instructors = collections.defaultdict(set)
    departments = collections.defaultdict(set)
    periods = collections.defaultdict(set)
    terms = collections.defaultdict(set)
    intervals = collections.defaultdict(set)
    inverted = collections.defaultdict(set)
    years = collections.defaultdict(set)
    sequences = collections.defaultdict(set)
    offerings = collections.defaultdict(set)
    records = []
    for course_id, a in schedules.items():
        for year, b in a.items():
            for period, c in b.items():
                if isinstance(c, list):
                    # Deal with Firebase's array heuristic.
                    c = transform(c)
                periods[period].add(course_id)
                years[year].add(course_id)
                departments[course_id[:4]].add(course_id)
                terms['%s %s' % (period, year)].add(course_id)
                offerings[course_id].add('%s %s' % (period, year))
                for id, section in c.items():
                    for activity in section['primaries'] + list(
                            section.get('secondaries', {}).values()):
                        for instructor in activity.get('instructors', []):
                            instructors[instructor.replace('.', '')].add(
                                course_id)
                    for secondary in section.get('secondaries', {}).values():
                        schedule = [(s[0], s[1])
                                    for s in secondary.get('schedule', [])]
                        for primary in section.get('primaries'):
                            schedule.extend(
                                [(s[0], s[1])
                                 for s in primary.get('schedule', [])])
                        # schedule contains a complete representation of one option.
                        schedule_key = ','.join([
                            '-'.join(str(x) for x in s)
                            for s in sorted(schedule)
                        ])
                        intervals[schedule_key or 'unknown'].add(course_id)
                    else:
                        schedule = []
                        for primary in section.get('primaries'):
                            schedule.extend(
                                [(s[0], s[1])
                                 for s in primary.get('schedule', [])])
                        # schedule contains a complete representation of one option.
                        schedule_key = ','.join([
                            '-'.join(str(x) for x in s)
                            for s in sorted(schedule)
                        ])
                        intervals[schedule_key or 'unknown'].add(course_id)
                    # Construct the inverted index based on the course description and name.
                    info = course_info.get(course_id, {})
                    name = info.get('name', '')
                    description = course_descriptions.get(course_id, {}).get(
                        'description', '')
                    sequence = course_descriptions.get(course_id,
                                                       {}).get('sequence')
                    if sequence:
                        sequences[sequence].add(course_id)
                    for word in get_words(course_id) | get_words(
                            name) | get_words(description):
                        inverted[word].add(course_id)
                    section['section'] = id
                    section['year'] = int(year)
                    section['period'] = period
                    section['course'] = course_id
                    records.append((course_id, int(year), period,
                                    course_id[:4], json.dumps(section)))
    cache = sqlite3.connect('cache.db')
    cursor = cache.cursor()
    cursor.execute('DELETE FROM courses')
    cursor.executemany(
        'INSERT INTO courses (course, year, period, department, record) VALUES (?, ?, ?, ?, ?)',
        records)
    cache.commit()
    cache.close()

    def flatten_set(d):
        return dict([(a, list(b)) for a, b in d.items()])

    db.child('indexes').set({
        'fulltext': flatten_set(inverted),
        'instructors': flatten_set(instructors),
        'departments': flatten_set(departments),
        'periods': flatten_set(periods),
        'terms': flatten_set(terms),
        'years': flatten_set(years),
        'schedules': flatten_set(intervals),
        'offerings': flatten_set(offerings),
        'sequences': flatten_set(sequences),
        'all': list(schedules.keys())
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
