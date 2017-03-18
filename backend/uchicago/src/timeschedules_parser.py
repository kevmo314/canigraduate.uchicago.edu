import bs4
import collections
import datetime
import multiprocessing
import os
import re
import requests

from .course import Course
from .section import Section
from .activity import PrimaryActivity, SecondaryActivity

SCHEDULE_REGEX = re.compile(r'(.+?)([\d:APM]+)-([\d:APM]+)')
MIDNIGHT = datetime.datetime.strptime('12:00AM', '%I:%M%p')

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

    def next_schedule(self):
        s = self.next_string()
        if s.startswith('ARR') or s == '':
            return []
        tokens = SCHEDULE_REGEX.match(s)
        if tokens is None:
            raise Exception('Could not parse "%s"' % s)
        days = tokens.group(1)
        from_time = int((datetime.datetime.strptime(tokens.group(2), '%I:%M%p') - MIDNIGHT).total_seconds() / 60)
        to_time = int((datetime.datetime.strptime(tokens.group(3), '%I:%M%p') - MIDNIGHT).total_seconds() / 60)
        intervals = []
        if days == 'M-F':
            days = 'MTWThF'
        search_space = [
            ['Sun'],
            ['M', 'MO', 'Mo', 'Mon'],
            ['T', 'TU', 'Tu', 'Tue'],
            ['W', 'WE', 'We', 'Wed'],
            ['T', 'H', 'R', 'TH', 'Th', 'Thu'],
            ['F', 'FR', 'Fr', 'Fri'],
            ['Sat']
        ]
        offset = 0
        i = 0
        while i < len(days):
            if offset == len(search_space):
                raise Exception('No valid parsing for "%s"' % s)
            for search in sorted(search_space[offset], key=len, reverse=True):
                if days[i:(i+len(search))] == search:
                    # We found a match!
                    intervals.append([offset * 24 * 60 + from_time, offset * 24 * 60 + to_time])
                    i += len(search)
                    break
            offset += 1
        if len(intervals) == 0:
            raise Exception('No intervals resulted from "%s"' % s)
        return intervals


    def next_section(self):
        text = self.next_string()
        data = re.split('\s[/-]\s', text)
        if len(data) != 3 or len(data[0]) + len(data[1]) != 9:
            self.index -= 1
            raise ValueError()
        name = self.next_string()
        units = self.next_string()
        instructors = list(filter(None, self.next_string().replace('.', '').split(' ; ')))
        schedule = self.next_schedule()
        type = self.next_string()
        self.index += 2
        enrollment = self.next_string()
        enrollment_limit = self.next_string()
        location = self.next_string()
        self.index += 1
        crosslists = [x for x in self.next_string().split(',') if len(x) > 0]
        self.index += 1
        if name == 'CANCELLED':
            raise ValueError()
        return Course(id='%s %s' % (data[0], data[1])), Section(
                id=data[2],
                name=name,
                units=units,
                instructors=instructors,
                schedule=schedule,
                type=type,
                enrollment=[enrollment, enrollment_limit],
                location=location), crosslists

    def next_activity(self):
        self.index += 3
        instructors = list(filter(None, self.next_string().replace('.', '').split(' ; ')))
        schedule = self.next_schedule()
        section_type = self.next_string()
        activity_id = self.next_string()
        activity_type = self.next_string()
        enrollment = self.next_string()
        enrollment_limit = self.next_string()
        location = self.next_string()
        self.index += 3
        if not activity_type:
            return PrimaryActivity(
                    instructors=instructors if instructors else self.section.instructors,
                    schedule=schedule,
                    type=section_type,
                    location=location)
        else:
            return SecondaryActivity(
                    id=activity_id,
                    instructors=instructors,
                    schedule=schedule,
                    type=activity_type,
                    location=location,
                    enrollment=[enrollment, enrollment_limit])
        

    def execute(self):
        while self.index < len(self.cells):
            try:
                course, section, crosslists = self.next_section()
                self.section = section
                self.course = course
                self.results[course][section.id] = section
                # This is sort of a hack...
                if '_crosslists' not in self.results[course]:
                    self.results[course]['_crosslists'] = set()
                self.results[course]['_crosslists'].update(crosslists)
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
