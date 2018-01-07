import bs4
import re
import requests

from .term import Term, MINIMUM_TERM
from .timeschedules_fsm import FSM

BASE_URL = 'http://timeschedules.uchicago.edu/'


def get_terms():
    uri = BASE_URL + 'browse.php'
    timeschedules = bs4.BeautifulSoup(requests.get(uri).text, 'lxml')
    for option in timeschedules.find('select',
                                     {'id': 'term_name'}).find_all('option'):
        if option.has_attr('value'):
            term = Term(option.getText())
            if term >= MINIMUM_TERM:
                yield (term, option['value'])


def get_department_urls(id):
    uri = BASE_URL + 'browse.php?term=%s&submit=Submit' % id
    matches = re.finditer(r'view\.php\?dept=(.+?)&term=' + id,
                          requests.get(uri).text)
    visited = set()
    for x in matches:
        if x.group(1) not in visited:
            visited.add(x.group(1))
            yield (x.group(1), BASE_URL + x.group(0))


def parse_department(uri):
    page = bs4.BeautifulSoup(requests.get(uri).text, 'lxml')
    results = {}
    for table in page.find_all('tbody'):
        results.update(FSM(table.find_all('td')).execute())
    return list(results.items())