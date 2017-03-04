import collections
import pyrebase
import json
import httplib2

from lib import Term

firebase = pyrebase.initialize_app({
    'apiKey': 'AIzaSyCjBDyhwbXcp9kEIA2pMHLDGxmCM4Sn6Eg',
    'authDomain': 'canigraduate-43286.firebaseapp.com',
    'databaseURL': 'https://canigraduate-43286.firebaseio.com',
    'storageBucket': 'canigraduate-43286.appspot.com',
    'serviceAccount': 'service_account_key.json'
})

def rebuild_indexes(db):
    schedules = db.child('schedules').get().val()
    instructors = collections.defaultdict(set)
    departments = collections.defaultdict(set)
    periods = collections.defaultdict(set)
    intervals = collections.defaultdict(set)
    for course_id, a in schedules.items():
        for year, b in a.items():
            for period, c in b.items():
                for id, section in c.items():
                    for instructor in section.get('instructors', []):
                        instructors[instructor].add(course_id)
                    departments[course_id[:4]].add(course_id)
                    periods[period].add(course_id)
                    # Firebase doesn't store empty arrays.
                    for schedule in section.get('schedule', []):
                        print(section)
                        intervals['%d-%d' % (schedule[0], schedule[1])].add(course_id)
    db.child('indexes').child('instructors').set(dict([(a, list(b)) for a, b in instructors.items()]))
    db.child('indexes').child('departments').set(dict([(a, list(b)) for a, b in departments.items()]))
    db.child('indexes').child('periods').set(dict([(a, list(b)) for a, b in periods.items()]))
    db.child('indexes').child('schedules').set(dict([(a, list(b)) for a, b in intervals.items()]))

def scrape_data(db):
    terms = sorted(list(Term.all()))
    index = 0
    known_course_info = db.child('course-info').get().val()
    while len(terms) > 0:
        term = terms.pop(0)
        index += 1
        updates = {}
        for course, sections in term.courses.items():
            data = known_course_info.get(course.id, {'crosslists': []})
            for id, section in sections.items():
                if id == '_crosslists':
                    continue
                if data.get('name', section.name) != section.name:
                    print('[%s] Conflicting course name for %s: %s, %s' % (term, course.id, data, section.name))
                data['name'] = section.name
                data['crosslists'] = list(set(data.get('crosslists', [])) | set(sections.get('_crosslists', set())))
                year = term.id[-4:]
                period = term.id[:6]
                updates['schedules/%s/%s/%s/%s' % (course.id, year, period, id)] = {
                    'notes': section.notes,
                    'instructors': section.instructors,
                    'schedule': section.schedule,
                    'type': section.type,
                    'enrollment': section.enrollment,
                    'location': section.location
                }
            known_course_info[course.id] = data
            updates['course-info/%s' % course.id] = data
        try:
            db.update(updates)
        except:
            print(updates)
            raise
        print(term, '%d updates' % len(updates))

if __name__ == '__main__':
    db = firebase.database()
    #db.child('schedules').set({})
    #scrape_data(db)
    rebuild_indexes(db)
