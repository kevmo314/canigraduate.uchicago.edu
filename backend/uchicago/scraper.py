import collections
import re

import pyrebase

from src import Term

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
    'service_account_key.json'
})

def transform(a):
    return dict([(i, j) for i, j in enumerate(a) if j is not None])

def get_words(text):
    return set(ALPHANUMERIC.sub('', text.lower()).split())


def rebuild_indexes(db):
    schedules = db.child('schedules').get().val()
    course_info = db.child('course-info').get().val()
    instructors = collections.defaultdict(set)
    departments = collections.defaultdict(set)
    periods = collections.defaultdict(set)
    terms = collections.defaultdict(set)
    intervals = collections.defaultdict(set)
    inverted = collections.defaultdict(set)
    for course_id, a in schedules.items():
        for year, b in a.items():
            for period, c in b.items():
                if isinstance(c, list):
                    # Deal with Firebase's array heuristic.
                    c = transform(c)
                for id, section in c.items():
                    for section in section['primaries'] + list(
                            section.get('secondaries', {}).values()):
                        for instructor in section.get('instructors', []):
                            instructors[instructor].add(course_id)
                    departments[course_id[:4]].add(course_id)
                    periods[period].add(course_id)
                    terms['%s %s' % (period, year)].add(course_id)
                    # Construct the inverted index based on the course description and name.
                    info = course_info.get(course_id, {})
                    name = info.get('name', '')
                    description = info.get('description', '')
                    print(name)
                    for word in get_words(course_id) | get_words(
                            name) | get_words(description):
                        inverted[word].add(course_id)
                    # Firebase doesn't store empty arrays.
                    for schedule in section.get('schedule', []):
                        intervals['%d-%d' % (schedule[0],
                                             schedule[1])].add(course_id)

    def flatten_set(d):
        return dict([(a, list(b)) for a, b in d.items()])

    db.child('indexes').child('fulltext').set(flatten_set(inverted))
    db.child('indexes').child('instructors').set(flatten_set(instructors))
    db.child('indexes').child('departments').set(flatten_set(departments))
    db.child('indexes').child('periods').set(flatten_set(periods))
    db.child('indexes').child('terms').set(flatten_set(terms))
    db.child('indexes').child('schedules').set(flatten_set(intervals))
    db.child('indexes').child('all').set(list(schedules.keys()))


def scrape_data(db):
    terms = sorted(list(Term.all()))
    index = 0
    known_course_info = db.child('course-info').get().val()
    while terms:
        term = terms.pop(0)
        index += 1
        updates = {}
        for course, sections in term.courses.items():
            data = known_course_info.get(course.id, {'crosslists': []})
            data['description'] = data.get('description', course.description)
            for id, section in sections.items():
                if data.get('name', section.name) != section.name:
                    print('[%s] Conflicting course name for %s: %s, %s' %
                          (term, course.id, data, section.name))
                data['name'] = section.name
                data['crosslists'] = list(
                    set(data.get('crosslists', [])) |
                    set(section.crosslists))
                year = term.id[-4:]
                period = term.id[:6]
                updates['schedules/%s/%s/%s/%s' %
                        (course.id, year, period, id)] = {
                            'term': '%s %s' % (period, year),
                            'department': course.id[:4],
                            'prerequisites': section.prerequisites,
                            'notes': section.notes,
                            'enrollment': section.enrollment,
                            'primaries': [{
                                'instructors': primary.instructors,
                                'schedule': primary.schedule,
                                'type': primary.type,
                                'location': primary.location
                            } for primary in section.primaries],
                            'secondaries': dict([(secondary.id, {
                                'instructors': secondary.instructors,
                                'schedule': secondary.schedule,
                                'type': secondary.type,
                                'location': secondary.location,
                                'enrollment': secondary.enrollment
                            }) for secondary in section.secondaries])
                        }
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
    scrape_data(db)
    # rebuild_indexes(db)
