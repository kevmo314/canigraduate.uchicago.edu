import bs4
import collections
import multiprocessing
import re
import requests

from .course import Course
from .section import Section
from .activity import PrimaryActivity, SecondaryActivity

class FSM(object):
    def __init__(self, cells):
        self.cells = list(cells)
        self.section = None
        self.course = None
        self.index = 0
        self.results = collections.defaultdict(dict)

    def next(self):
        result = self.cells[self.index]
        self.index += 1
        return result

    def next_string(self):
        return self.next().getText().strip()

    def next_section(self):
        text = self.next_string()
        data = re.split('\s[/-]\s', text)
        if len(data) != 3 or len(data[0]) + len(data[1]) != 9:
            self.index -= 1
            raise ValueError()
        name = self.next_string()
        units = self.next_string()
        instructor = self.next_string()
        schedule = self.next_string()
        type = self.next_string()
        self.index += 2
        enrollment = self.next_string()
        enrollment_limit = self.next_string()
        location = self.next_string()
        self.index += 3
        if name == 'CANCELLED':
            raise ValueError()
        return Course(id='%s %s' % (data[0], data[1])), Section(
                id=data[2],
                name=name,
                units=units,
                instructor=instructor,
                schedule=schedule,
                type=type,
                enrollment=[enrollment, enrollment_limit],
                location=location)

    def next_activity(self):
        self.index += 3
        instructor = self.next_string()
        schedule = self.next_string()
        section_type = self.next_string()
        activity_id = self.next_string()
        activity_type = self.next_string()
        enrollment = self.next_string()
        enrollment_limit = self.next_string()
        location = self.next_string()
        self.index += 3
        if not activity_type:
            return PrimaryActivity(
                    instructor=instructor if instructor else self.section.instructor,
                    schedule=schedule,
                    type=section_type,
                    location=location)
        else:
            return SecondaryActivity(
                    id=activity_id,
                    instructor=instructor,
                    schedule=schedule,
                    type=activity_type,
                    location=location,
                    enrollment=[enrollment, enrollment_limit])
        

    def execute(self):
        while self.index < len(self.cells):
            try:
                course, section = self.next_section()
                self.section = section
                self.course = course
                self.results[course][section.id] = section
            except ValueError:
                if self.section:
                    if self.cells[self.index].has_attr('colspan') and self.cells[self.index]['colspan'] == '24':
                        self.course.notes.append(self.next_string())
                    else:
                        activity = self.next_activity()
                        if isinstance(activity, PrimaryActivity):
                            self.section.primaries.append(activity)
                        if isinstance(activity, SecondaryActivity):
                            self.section.secondaries.append(activity)
                else:
                    self.index += 1
        return self.results

def parse_page(url):
    page = bs4.BeautifulSoup(requests.get('http://timeschedules.uchicago.edu/' + url).text, 'lxml')
    results = {}
    for table in page.find_all('tbody'):
         results.update(FSM(table.find_all('td')).execute())
    return results

class TimeSchedules(object):
    def __init__(self, id):
        self.id = id

    @property
    def courses(self):
        department_page = requests.get('http://timeschedules.uchicago.edu/browse.php?term=%s&submit=Submit' % self.id).text
        results = {}
        p = multiprocessing.Pool(10)
        for page in p.map(parse_page, re.findall(r'view\.php\?dept=.+?&term=' + self.id, department_page)):
            results.update(page)
        p.close()
        return results

if __name__ == '__main__':
    # print(parse_page('view.php?dept=MATH&term=467'))
    print(TimeSchedules('467').courses)
