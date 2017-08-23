import collections
import multiprocessing
import bs4
import re
import requests
import unicodedata

BASE_URL = 'http://collegecatalog.uchicago.edu'
TITLE_PATTERN = re.compile(r'([^\.]+)\.  (.+?)\.?(?:  \d+ Units\.)?')

Record = collections.namedtuple(
    'Record', ['course', 'name', 'description', 'detail', 'parent'])


def parse_title(title):
    match = TITLE_PATTERN.fullmatch(
        unicodedata.normalize("NFKD", title.strip()))
    if not match:
        return None, None, None
    return match.group(1).strip(), match.group(2)


def parse_department(url):
    page = bs4.BeautifulSoup(requests.get(BASE_URL + url).text, 'lxml')
    courses = page.find('div', {'class': 'courses'})
    if not courses:
        return []
    results = []
    course_blocks = courses.find_all('div', {'class': 'courseblock'})
    previous_record = None
    for block in course_blocks:
        title = block.find('p', {'class': 'courseblocktitle'})
        if title is None:
            continue
        course, name = parse_title(title.text)
        if course is None:
            print('Failed to parse:', title.text)
            continue
        description = block.find('p', {'class': 'courseblockdesc'})
        detail = block.find('p', {'class': 'courseblockdetail'})
        record = Record(course, name,
                        unicodedata.normalize("NFKD", description.text.strip())
                        if description else None,
                        unicodedata.normalize("NFKD", detail.text.strip())
                        if detail else None, previous_record
                        if 'subsequence' in block['class'] else None)
        if 'subsequence' not in block['class']:
            previous_record = record
        results.append(record)
    return results


def CollegeCatalogParser():
    catalog_page = bs4.BeautifulSoup(
        requests.get(BASE_URL + '/thecollege/programsofstudy/').text, 'lxml')
    pool = multiprocessing.Pool(16)
    results = pool.map(parse_department, [
        link.find('a').get('href')
        for link in catalog_page.find(
            'ul', {'id': '/thecollege/programsofstudy/'}).find_all('li')
    ])
    results = [x for sublist in results for x in sublist]
    courses = {}
    sequences = {}
    for result in results:
        if len(result.course) == 10:
            courses[result.course] = {
                'name': result.name,
                'description': result.description,
                'notes': result.detail,
                'sequence': result.parent.course if result.parent else None
            }
        else:
            sequences[result.course] = {
                'name': result.name,
                'description': result.description,
                'notes': result.detail,
            }
    return courses, sequences
