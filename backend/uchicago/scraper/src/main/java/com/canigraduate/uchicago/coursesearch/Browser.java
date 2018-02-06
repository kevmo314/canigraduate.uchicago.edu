package com.canigraduate.uchicago.coursesearch;

import com.canigraduate.uchicago.BrowsingSession;
import com.google.common.collect.ImmutableMap;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

class Browser {
    private static final String COURSE_SEARCH_URL = "https://coursesearch.uchicago.edu/psc/prdguest/EMPLOYEE/HRMS/c/UC_STUDENT_RECORDS_FL.UC_CLASS_SEARCH_FL.GBL";

    private final BrowsingSession session;
    private final HashMap<String, String> data;
    private int counter;
    private String id;
    private Document homepage;

    public Browser() throws IOException {
        this.session = new BrowsingSession();
        this.data = new HashMap<>();
        this.homepage = this.parse(this.session.get("https://coursesearch.uchicago.edu/"));
    }

    public Browser setId(String id) {
        this.id = id;
        return this;
    }

    private synchronized Document parse(Document doc) {
        for (Element element : doc.select("input[name^='IC']")) {
            this.data.put(element.attr("name"), element.attr("value"));
        }
        return doc;
    }

    public Document action(String name) throws IOException {
        return this.action(name, ImmutableMap.of());
    }

    public synchronized Document action(String name, Map<String, String> requestData) throws IOException {
        Map<String, String> data = new HashMap<>(this.data);
        data.put("ICAction", name);
        data.put("ICStateNum", String.valueOf(++this.counter));
        if (this.id != null) {
            data.put("UC_CLSRCH_WRK2_STRM", this.id);
        }
        data.putAll(requestData);
        return this.parse(this.session.post(COURSE_SEARCH_URL, data));
    }

    public Document getHomepage() {
        return this.homepage;
    }
}

/*


class CourseSearch(object):
    def __init__(self, id):
        self.coursesearch_id = id
        self.session = requests.Session()
        self.session.headers = {
            'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)'
        }
        self.session.mount('https://', HTTPAdapter(max_retries=3))
        self.counter = 1
        self.data = {}
        self.index_shard = -1

    def courses(self, department, index):
        self.index_shard = index
        self.parse(
            self.session.get('https://coursesearch.uchicago.edu/', timeout=30))
        # Select the term.
        self.action('UC_CLSRCH_WRK2_STRM')
        # Then run the department search.
        page = self.parse_results_page(
            self.action('UC_CLSRCH_WRK2_SEARCH_BTN',
                        {'UC_CLSRCH_WRK2_SUBJECT': department}), department)
        results = collections.defaultdict(dict)
        for section in page:
            results[section.course][section.id] = section
        return results

    @property
    def departments(self):
        self.parse(
            self.session.get('https://coursesearch.uchicago.edu/', timeout=30))
        # Get the departments
        page = self.action('UC_CLSRCH_WRK2_STRM')
        page.select('#UC_CLSRCH_WRK2_SUBJECT option')
        return set(x['value']
                   for x in page.select('#UC_CLSRCH_WRK2_SUBJECT option')
                   if len(x['value']) > 0)

    def parse_results_page(self, page, department):
        error = page.find('span', {'id':
                                   'DERIVED_CLSMSG_ERROR_TEXT'}).text.strip()
        if error and self.index_shard <= 0:
            # Only the first index shard should report page-level errors.
            warnings.warn('[%s %s] %s' % (self.coursesearch_id, department,
                                          error))
        records = page.select('tr[id^="DESCR100"]')
        for index, row in enumerate(records):
            if self.index_shard != -1 and index % 25 != self.index_shard:
                # Ignore this course if we're not delegated to this index shard.
                continue
            chip = row.find('span', {'class': 'label'})
            if chip and chip.text.strip() == 'Cancelled':
                # Ignore cancelled courses
                continue
            if not row.find('span', {
                    'id':
                    re.compile(r'^UC_CLSRCH_WRK_UC_CLASS_TITLE\$\d+')
            }).text.strip():
                # Sometimes you get an empty course...
                continue
            section = self.parse_section_page(
                self.action('UC_RSLT_NAV_WRK_PTPG_NUI_DRILLOUT$%d' % index))
            self.action('UC_CLS_DTL_WRK_RETURN_PB$0')
            if section:
                yield section
        # Visit next page.
        if len(records) == 25 and page.find(
                'a', {'id': 'UC_RSLT_NAV_WRK_SEARCH_CONDITION2$46$'}):
            results = self.parse_results_page(
                self.action('UC_RSLT_NAV_WRK_SEARCH_CONDITION2$46$'),
                department)
            for result in results:
                yield result

    def parse_section_page(self, page):
        course_name = page.find(
            'span', {'id': 'UC_CLS_DTL_WRK_UC_CLASS_TITLE$0'}).text.strip()
        descriptor = page.find(
            'div', {'id': 'win0divUC_CLS_DTL_WRK_HTMLAREA$0'}).text.strip()
        match = DESCRIPTOR_REGEX.match(descriptor)
        if not match:
            warnings.warn('[%s %s] Could not match course descriptor: %s' %
                          (self.coursesearch_id, course_name, descriptor))
            return None
        course_id = match.group('id')
        section_id = match.group('section')
        enrollment = page.find('span', {'id': 'UC_CLS_DTL_WRK_DESCR3$0'}).text.strip() \
            or page.find('span', {'id': 'UC_CLS_DTL_WRK_DESCR1$0'}).text.strip()
        enrollment = enrollment.split()[-1].split('/')
        notes = page.find('span',
                          {'id': 'DERIVED_CLSRCH_SSR_CLASSNOTE_LONG$0'})
        if notes:
            notes = notes.text
        units = int(
            page.find('span', {'id': 'UC_CLS_DTL_WRK_UNITS_RANGE$0'})
            .text.split()[0])
        prerequisites = page.find(
            'span', {'id': 'UC_CLS_DTL_WRK_SSR_REQUISITE_LONG$0'})
        if prerequisites:
            prerequisites = prerequisites.text.strip()
        crosslists = filter(
            lambda x: len(x) == 10,
            map(lambda x: x['value'].split('/')[0].strip(),
                page.select('#UC_CLS_DTL_WRK_DESCR125$0 option')))
        components = list(
            map(lambda x: x.strip(),
                page.find('div', {
                    'id': 'win0divUC_CLS_DTL_WRK_SSR_COMPONENT_LONG$0'
                }).text.split(',')))
        tables = page.select(
            '[id^="win0divUC_CLS_REL_WRK_RELATE_CLASS_NBR_1"]')
        secondary_components = set()
        secondaries = []
        for table in tables:
            if 'psc_hidden' in table.parent.get('class', []):
                # AIS renders random shit sometimes.
                continue
            component = table.find('h1').text.strip()
            secondary_components.add(component)
            for row in table.select('tr'):
                secondary = self.parse_secondary(row, component)
                if secondary:
                    secondaries.append(secondary)
        primary_components = [
            c for c in components if c not in secondary_components
        ]
        primary_rows = page.select('#win0divSSR_CLSRCH_MTG1$0 tr.ps_grid-row')
        if len(primary_components) != 1 and len(primary_components) != len(
                primary_rows):
            warnings.warn(
                '[%s] Could not resolve primary components uniquely. %s - %s' %
                (course_id, components, secondary_components))
        section = Section(
            id=section_id,
            course=Course(id=course_id),
            name=course_name,
            enrollment=enrollment,
            units=units)
        section.prerequisites = prerequisites
        if notes:
            section.notes.append(notes)
        section.crosslists.update(crosslists)
        for index, row in enumerate(primary_rows):
            if len(primary_components) == 1:
                primary_component = primary_components[0]
            elif len(primary_components) == len(primary_rows):
                primary_component = primary_components[index]
            else:
                primary_component = None
            section.primaries.append(
                self.parse_primary(row, primary_component))
        section.secondaries.extend(secondaries)
        # print(section)
        return section

    def parse_schedule(self, schedule):
        separates = [x.strip() for x in schedule.split('&')]
        if len(separates) > 1:
            results = []
            for s in separates:
                results.extend(self.parse_schedule(s))
            return results
        if schedule == 'TBA':
            return []
        components = [x.strip() for x in schedule.split(':', 1)]
        times = [x.strip() for x in components[-1].split('-')]
        if not times[0] or not times[1]:
            return []
        from_time = int(
            (datetime.datetime.strptime(times[0], '%I:%M %p') - MIDNIGHT
             ).total_seconds() / 60)
        to_time = int(
            (datetime.datetime.strptime(times[1], '%I:%M %p') - MIDNIGHT
             ).total_seconds() / 60)
        days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        result = []
        for offset, day in enumerate(days):
            if day in components[0]:
                result.append(
                    [offset * 24 * 60 + from_time, offset * 24 * 60 + to_time])
        return result

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
        schedule = self.parse_schedule(
            row.find('div', {'id': re.compile(r'^win0divDISC_SCHED\$\d+')})
            .text.strip())
        location = row.find(
            'div', {'id': re.compile(r'^win0divDISC_ROOM\$\d+')}).text.strip()
        return SecondaryActivity(
            id=section_id,
            enrollment=enrollment,
            instructors=list(set(instructors)),
            schedule=schedule,
            location=location,
            type=type)

    def parse_primary(self, row, type):
        instructors = map(
            lambda x: x.strip(),
            row.find('span', {'id': re.compile(r'^MTG\$\d+')}).text.split(','))
        schedule = self.parse_schedule(
            row.find('span', {'id': re.compile(r'^MTG_SCHED\$\d+')})
            .text.strip())
        location = row.find('span',
                            {'id': re.compile(r'^MTG_LOC\$\d+')}).text.strip()
        return PrimaryActivity(
            instructors=list(set(instructors)),
            schedule=schedule,
            location=location,
            type=type)

 */