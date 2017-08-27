import bs4
import collections
import multiprocessing
import unicodedata
import requests
import re

TITLE_PATTERN = re.compile(r'([^\.]+)\.  (.+?)\.?(?:  \d+ Units\.)?')

Record = collections.namedtuple('Record', ['name', 'description'])


def parse_title(title):
    match = TITLE_PATTERN.fullmatch(
        unicodedata.normalize("NFKD", title.strip()))
    if not match:
        return None, None, None
    return match.group(2)


def fetch_ribbit_data(course):
    page = bs4.BeautifulSoup(
        requests.get(
            'http://collegecatalog.uchicago.edu/ribbit/index.cgi?page=getcourse.rjs&code='
            + course).text, 'html.parser')
    cdata = page.find(text=lambda tag: isinstance(tag, bs4.CData))
    if not cdata:
        return None
    cdata = bs4.BeautifulSoup(cdata.string.strip(), 'lxml')
    title = cdata.find('p', {'class': 'courseblocktitle'})
    description = cdata.find('p', {'class': 'courseblockdesc'})
    if not title:
        return None
    return Record(
        parse_title(title.text), description.text if description else None)


def RibbitParser(courses):
    pool = multiprocessing.Pool(16)
    results = {}
    for i, record in enumerate(pool.imap(fetch_ribbit_data, courses, 20), 1):
        if i % 100 == 0:
            print('Ribbit: {0:%}'.format(i / len(courses)))
        if record:
            results[courses[i]] = record
    return results
