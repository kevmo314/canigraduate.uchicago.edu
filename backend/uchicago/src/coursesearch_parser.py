import re
import warnings

import bs4
import requests

from .course import Course
from .section import Section
from .activity import PrimaryActivity, SecondaryActivity

COURSE_SEARCH_URL = 'https://coursesearch.uchicago.edu/psc/prdguest/EMPLOYEE/HRMS/c/UC_STUDENT_RECORDS_FL.UC_CLASS_SEARCH_FL.GBL'
DESCRIPTOR_REGEX = re.compile(
    r'(?P<id>[A-Z]{4} [0-9]{5})\/(?P<section>[0-9A-Za-z]+) \[(?P<section_id>[0-9]+)\] - (?P<type>[A-Z]+).+'
)
SECTION_REGEX = re.compile(
    r'Section (?P<section>[0-9A-Za-z]+) \[(?P<section_id>[0-9]+)\] - (?P<type>[A-Z]+).+'
)


class CourseSearch(object):
    def __init__(self, term, id):
        self.term = term
        self.coursesearch_id = id
        self.session = requests.Session()
        self.session.headers = {
            'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)'
        }
        self.counter = 1
        self.data = {}

    def parse(self, response):
        page = bs4.BeautifulSoup(response.text, 'lxml')
        targets = page.select('input[name^="IC"]')
        self.data.update(
            zip(
                map(lambda x: x['name'], targets),
                map(lambda x: x['value'], targets)))
        return page

    def action(self, name, data={}, **kwargs):
        data = {**self.data, **{
            'ICAction': name,
            'ICStateNum': str(self.counter),
            'UC_CLSRCH_WRK2_STRM': self.coursesearch_id
        }, **data}
        self.counter += 1
        return self.parse(
            self.session.post(COURSE_SEARCH_URL, data=data, **kwargs))

    @property
    def courses(self):
        self.parse(self.session.get('https://coursesearch.uchicago.edu/'))
        # Get the departments
        page = self.action('UC_CLSRCH_WRK2_STRM')
        results = []
        for department in filter(
                len,
                map(lambda x: x['value'],
                    page.select('#UC_CLSRCH_WRK2_SUBJECT option'))):
            department = 'PHYS'
            results.extend(
                self.parse_results_page(
                    self.action('UC_CLSRCH_WRK2_SEARCH_BTN', {
                        'UC_CLSRCH_WRK2_SUBJECT': department
                    }), department))
            break
        return results

    def parse_results_page(self, page, department):
        error = page.find('span', {'id':
                                   'DERIVED_CLSMSG_ERROR_TEXT'}).text.strip()
        if error:
            warnings.warn('[%s] %s' % (department, error))
        for index, _ in enumerate(page.select('tr[id^="DESCR100"]')):
            yield self.parse_section_page(
                self.action('UC_RSLT_NAV_WRK_PTPG_NUI_DRILLOUT$%d' % index))
            self.action('UC_CLS_DTL_WRK_RETURN_PB$0')
        # Visit next page.
        if page.find('a', {'id': 'UC_RSLT_NAV_WRK_SEARCH_CONDITION2$46$'}):
            yield from self.parse_results_page(
                self.action('UC_RSLT_NAV_WRK_SEARCH_CONDITION2$46$'),
                department)

    def parse_section_page(self, page):
        course_name = page.find(
            'span', {'id': 'UC_CLS_DTL_WRK_UC_CLASS_TITLE$0'}).text.strip()
        match = DESCRIPTOR_REGEX.match(
            page.find('div', {'id': 'win0divUC_CLS_DTL_WRK_HTMLAREA$0'})
            .text.strip())
        course_id = match.group('id')
        section_id = match.group('section')
        description = page.find(
            'span', {'id': 'UC_CLS_DTL_WRK_DESCRLONG$0'}).text.strip()
        enrollment = page.find(
            'span', {'id':
                     'UC_CLS_DTL_WRK_DESCR1$0'}).text.split()[-1].split('/')
        notes = page.find('span',
                          {'id': 'DERIVED_CLSRCH_SSR_CLASSNOTE_LONG$0'})
        if notes:
            notes = notes.text.split()
        units = int(
            page.find('span', {'id': 'UC_CLS_DTL_WRK_UNITS_RANGE$0'})
            .text.split()[0])
        prerequisites = page.find(
            'span', {'id': 'UC_CLS_DTL_WRK_SSR_REQUISITE_LONG$0'})
        if prerequisites:
            prerequisites = prerequisites.text.strip()
        components = set(
            map(lambda x: x.strip(),
                page.find('div', {
                    'id': 'win0divUC_CLS_DTL_WRK_SSR_COMPONENT_LONG$0'
                }).text.split(',')))
        secondary_components = set(
            map(lambda x: x.text.strip(),
                page.select(
                    '[id^="win0divUC_CLS_REL_WRK_RELATE_CLASS_NBR_1"] h1')))
        primary_components = components - secondary_components
        if len(primary_components) != 1:
            warnings.warn(
                '[%s] Could not resolve primary components uniquely. %s - %s' %
                (course_id, components, secondary_components))
        section = Section(
            id=section_id,
            course=Course(id=course_id),
            name=course_name,
            enrollment=enrollment,
            units=units)
        if description:
            section.course.description = description
        section.prerequisites = prerequisites
        section.notes.append(notes)
        section.primaries.extend(map(
            lambda row: self.parse_primary(
                row, list(primary_components)[0] if primary_components else None),
            page.select('#win0divSSR_CLSRCH_MTG1$0 tr.ps_grid-row')))
        tables = page.select(
            '[id^="win0divUC_CLS_REL_WRK_RELATE_CLASS_NBR_1"]')
        for table in tables:
            component = table.find('h1').text.strip()
            for row in table.select('tr'):
                secondary = self.parse_secondary(row, component)
                if secondary:
                    section.secondaries.append(secondary)
        print(section)
        return section

    def parse_secondary(self, row, type):
        descriptor = row.find('div',
                              {'id': re.compile(r'^win0divDISC_HTM\$\d+')})
        if not descriptor:
            return None
        section_id = SECTION_REGEX.match(
            descriptor.text.strip()).group('section')
        enrollment = row.find('div', {
            'id':
            re.compile(r'^win0divUC_CLS_REL_WRK_DESCR1\$445\$\$\d+')
        }).text.strip().split()[-1].split('/')
        instructors = map(lambda x: x.strip(),
                          row.find('div', {
                              'id': re.compile(r'^win0divDISC_INSTR\$\d+')
                          }).text.split(','))
        schedule = row.find(
            'div', {'id':
                    re.compile(r'^win0divDISC_SCHED\$\d+')}).text.strip()
        location = row.find(
            'div', {'id': re.compile(r'^win0divDISC_ROOM\$\d+')}).text.strip()
        return SecondaryActivity(
            id=section_id,
            enrollment=enrollment,
            instructors=instructors,
            schedule=schedule,
            location=location,
            type=type)

    def parse_primary(self, row, type):
        instructors = map(
            lambda x: x.strip(),
            row.find('span', {'id': re.compile(r'^MTG\$\d+')}).text.split(','))
        schedule = row.find(
            'span', {'id': re.compile(r'^MTG_SCHED\$\d+')}).text.strip()
        location = row.find('span',
                            {'id': re.compile(r'^MTG_LOC\$\d+')}).text.strip()
        return PrimaryActivity(
            instructors=list(set(instructors)),
            schedule=schedule,
            location=location,
            type=type)
