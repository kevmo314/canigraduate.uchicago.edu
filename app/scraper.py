import collections
import json
import httplib2
from oauth2client.client import GoogleCredentials

from lib import Term

def get_http():
    http = httplib2.Http()
    GoogleCredentials.get_application_default().create_scoped([
        'https://www.googleapis.com/auth/firebase.database',
        'https://www.googleapis.com/auth/userinfo.email'
    ]).authorize(http)
    return http
    

def run():
    terms = sorted(list(Term.all()))
    while len(terms) > 0:
        term = terms.pop(0)
        data = collections.defaultdict(dict)
        for course, sections in term.courses.items():
            for id, section in sections.items():
                if data[course.id].get('name', section.name) != section.name:
                    print('[%s] Conflicting course name for %s: %s, %s' % (term, course.id, data[course.id], section.name))
                data[course.id]['name'] = section.name
        print(get_http().request(
            'https://canigraduate-43286.firebaseio.com/course-info.json',
            method='PATCH',
            body=json.dumps(data)))
        

if __name__ == '__main__':
    run()
