import bs4
import re
import requests

from requests.adapters import HTTPAdapter

from .term import Term, MINIMUM_TERM
from .coursesearch_parser import CourseSearch

BASE_URL = 'https://coursesearch.uchicago.edu/'


def get_terms():
    session = requests.Session()
    session.mount('http://', HTTPAdapter(max_retries=3))
    page = session.get(
        BASE_URL +
        'psc/prdguest/EMPLOYEE/HRMS/c/UC_STUDENT_RECORDS_FL.UC_CLASS_SEARCH_FL.GBL'
    )
    coursesearch = bs4.BeautifulSoup(page.text, 'lxml')
    for option in coursesearch.find(
            'select', {'id': 'UC_CLSRCH_WRK2_STRM'}).find_all('option'):
        if option.has_attr('value') and option['value']:
            term = Term(option.getText())
            if term >= MINIMUM_TERM:
                yield (term, option['value'])


def get_department_urls(id):
    for department in CourseSearch(id).departments:
        for i in range(25):
            yield (department, (id, department, i))


def parse_department(uri):
    id, department, i = uri
    return list(CourseSearch(id).courses(department, i).items())