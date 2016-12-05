import bs4
import functools
import requests

from timeschedules_parser import TimeSchedules
from coursesearch_parser import CourseSearch

@functools.total_ordering
class Term(object):

    def __init__(self, id):
        self.id = id

    @staticmethod
    def all():
        timeschedules = bs4.BeautifulSoup(requests.get('http://timeschedules.uchicago.edu/browse.php').text, 'lxml')
        for option in timeschedules.find('select', {'id': 'term_name'}).find_all('option'):
            if option.has_attr('value'):
                yield TimeSchedulesTerm(id=option.getText(), timeschedules_id=option['value'])
        coursesearch = bs4.BeautifulSoup(requests.get('https://coursesearch.uchicago.edu/psc/prdguest/EMPLOYEE/HRMS/c/UC_STUDENT_RECORDS_FL.UC_CLASS_SEARCH_FL.GBL').text, 'lxml')
        for option in coursesearch.find('select', {'id': 'UC_CLSRCH_WRK2_STRM'}).find_all('option'):
            if option.has_attr('value') and option['value']:
                yield CourseSearchTerm(id=option.getText(), coursesearch_id=option['value'])

    @property
    def ordinal(self):
        return 4 * int(self.id[-4:]) + ['Winter', 'Spring', 'Summer', 'Autumn'].index(self.id[:6])

    def __eq__(self, other):
        return self.id == other.id

    def __hash__(self):
        return self.ordinal

    def __lt__(self, other):
        return self.ordinal < other.ordinal

    def __str__(self):
        return self.id

    def __repr__(self):
        return '<%s>' % str(self)

class CourseSearchTerm(Term):
    def __init__(self, id, coursesearch_id):
        super(CourseSearchTerm, self).__init__(id)
        self.coursesearch_id = coursesearch_id

    @property
    def courses(self):
        return CourseSearch(self.id, self.coursesearch_id).courses

    def __str__(self):
        return '%s (%s)' % (self.id, self.coursesearch_id)

class TimeSchedulesTerm(Term):
    def __init__(self, id, timeschedules_id):
        super(TimeSchedulesTerm, self).__init__(id)
        self.timeschedules_id = timeschedules_id

    @property
    def courses(self):
        return TimeSchedulesParser(self.timeschedules_id).courses

    def __str__(self):
        return '%s (%s)' % (self.id, self.timeschedules_id)

if __name__ == '__main__':
    print(sorted(list(Term.all())))
