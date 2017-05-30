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
        if 'ARR' in s or s == '':
            return []
        tokens = SCHEDULE_REGEX.match(s)
        if tokens is None:
            raise Exception('Could not parse "%s"' % s)
        days = tokens.group(1).strip()
        from_time = int(
            (datetime.datetime.strptime(tokens.group(2), '%I:%M%p') - MIDNIGHT
             ).total_seconds() / 60)
        to_time = int(
            (datetime.datetime.strptime(tokens.group(3), '%I:%M%p') - MIDNIGHT
             ).total_seconds() / 60)
        intervals = []
        if days == 'M-F':
            days = 'MTWThF'
        search_space = [['sun'], ['mon'], ['tue'], ['wed'], ['h', 'r', 'thu'],
                        ['fri'], ['sat']]

        def dfs(offset, index):
            if offset == len(search_space):
                return [] if index == len(days) else None
            for search in search_space[offset]:
                for j in range(1, len(search) + 1):
                    if days[index:(index + j)].lower() == search[:j]:
                        result = dfs(offset + 1, index + j)
                        if result is not None:
                            return [[
                                offset * 24 * 60 + from_time,
                                offset * 24 * 60 + to_time
                            ]] + result
            return dfs(offset + 1, index)

        intervals = dfs(0, 0)
        if not intervals:
            raise Exception('No intervals resulted from "%s"' % s)
        return intervals

    def next_section(self):
        text = self.next_string()
        data = list(map(lambda s: s.strip(), re.split('\s[/-]\s', text)))
        if len(data) != 3 or len(data[0]) + len(data[1]) != 9:
            self.index -= 1
            raise ValueError()
        name = self.next_string()
        units = self.next_string()
        activity = self.next_activity()
        # Pull the enrollment.
        self.index -= 3
        enrollment = self.next_string()
        enrollment_limit = self.next_string()
        self.index += 1
        self.index += 1
        crosslists = set(
            [x for x in self.next_string().split(',') if len(x) > 0])
        self.index += 1
        if name == 'CANCELLED':
            raise ValueError()
        course = Course(id='%s %s' % (data[0], data[1]))
        section = Section(
            course=course,
            id=data[2],
            name=name,
            enrollment=[enrollment, enrollment_limit],
            units=units)
        section.primaries.append(activity)
        section.crosslists.update(crosslists)
        return course, section

    def next_activity(self):
        instructors = list(
            filter(None, self.next_string().replace('.', '').split(' ; ')))
        schedule = self.next_schedule()
        section_type = self.next_string()
        activity_id = self.next_string()
        activity_type = self.next_string()
        enrollment = self.next_string()
        enrollment_limit = self.next_string()
        location = re.sub(r'\s+-', '-', self.next_string())
        if not activity_type:
            return PrimaryActivity(
                instructors=instructors,
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
                course, section = self.next_section()
                self.section = section
                self.course = course
                self.results[course][section.id] = section
            except ValueError as e:
                if self.section:
                    if self.cells[self.index].has_attr(
                            'colspan'
                    ) and self.cells[self.index]['colspan'] == '24':
                        self.course.notes.append(self.next_string())
                    else:
                        self.index += 3
                        activity = self.next_activity()
                        self.index += 3
                        if isinstance(activity, PrimaryActivity):
                            self.section.primaries.append(activity)
                        if isinstance(activity, SecondaryActivity):
                            self.section.secondaries.append(activity)
                else:
                    self.index += 1
        return self.results


def parse_page(url):
    page = bs4.BeautifulSoup(
        requests.get('http://timeschedules.uchicago.edu/' + url).text, 'lxml')
    results = {}
    for table in page.find_all('tbody'):
        results.update(FSM(table.find_all('td')).execute())
    return results


class TimeSchedules(object):
    def __init__(self, id):
        self.id = id

    @property
    def courses(self):
        department_page = requests.get(
            'http://timeschedules.uchicago.edu/browse.php?term=%s&submit=Submit'
            % self.id).text
        results = {}
        p = multiprocessing.Pool(1)
        for page in p.imap_unordered(
                parse_page,
                re.findall(r'view\.php\?dept=.+?&term=' + self.id,
                           department_page)):
            results.update(page)
        p.close()
        return results
