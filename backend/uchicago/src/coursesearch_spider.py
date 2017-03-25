import collections
import re
import scrapy
import urllib

from scrapy.selector import Selector
from scrapy.http import FormRequest

from .course import Course
from .section import Section

class CourseSearchSpider(scrapy.Spider):
  name = "coursesearch-spider"
  start_urls = [
      'http://coursesearch.uchicago.edu/',
  ]
  COURSE_SEARCH_URL = 'https://coursesearch.uchicago.edu/psc/prdguest/EMPLOYEE/HRMS/c/UC_STUDENT_RECORDS_FL.UC_CLASS_SEARCH_FL.GBL'

  def __init__(self, **kw):
    super().__init__()
    self.label = kw.get('label')
    self.id = kw.get('id')

    self.descriptor_regex = re.compile(r'(?P<id>[A-Z]{4} [0-9]{5})\/(?P<section>[0-9A-Za-z]+) \[(?P<section_id>[0-9]+)\] - (?P<type>[A-Z]+)')
    
  def _generate_vars(self, selector):
    vars = {}
    for input in selector.css("input[name^='IC']"):
      vars[input.xpath('@name').extract_first()] = input.xpath('@value').extract_first() 
    vars['UC_CLSRCH_WRK2_STRM'] = self.id
    return vars
  
  def parse(self, response):
    vars = self._generate_vars(response)
    
    #First, set the session term to the selected term
    vars['ICAction'] = 'UC_CLSRCH_WRK2_STRM'
    request =  FormRequest(CourseSearchSpider.COURSE_SEARCH_URL, self._parse_term_data, formdata = vars)
    yield request
    
  def _parse_term_data(self, response):
    selector = Selector(text = response.body)
    vars = self._generate_vars(selector)
    
    #Run a search on each department sequentially
    vars['ICAction'] =  'UC_CLSRCH_WRK2_SEARCH_BTN'
    
    departments = list(filter(len, selector.css("#UC_CLSRCH_WRK2_SUBJECT option").xpath('@value').extract()))
        
    vars['UC_CLSRCH_WRK2_SUBJECT'] = departments[0]
    request =  FormRequest(CourseSearchSpider.COURSE_SEARCH_URL, self._parse_department_data, formdata = vars)
    #This list approach is used to ensure that scrapy processes departments sequentially; else AIS gets confused and returns nonsense
    request.meta['remaining'] = departments[1:]
    request.meta['dept'] = departments[0]
    request.meta['count'] = 0
    yield request
        
  def _parse_department_data(self, response):
    selector = Selector(text = response.body)
    
    if "exceeds the maximum limit" in selector.css("#DERIVED_CLSMSG_ERROR_TEXT::text").extract_first():
      self.logger.warn('Limit hit. Only 250 courses returned for %s', response.meta['dept'])
    
    for row in selector.css("tr[id^='DESCR100']"):
      yield self._parse_section(row)
        
    if selector.css("#win0divUC_RSLT_NAV_WRK_SEARCH_CONDITION2"):
      yield self._generate_next_page_request(response)
    else:
      yield self._generate_next_dept_request(response)
      
  def _generate_next_page_request(self, response):
    selector = Selector(text = response.body)
    vars = self._generate_vars(selector)
    
    vars['ICAction'] = 'UC_RSLT_NAV_WRK_SEARCH_CONDITION2$46$'
      
    request = FormRequest(CourseSearchSpider.COURSE_SEARCH_URL, self._parse_department_data, formdata = vars)
    request.meta['dept'] = response.meta['dept']
    request.meta['remaining'] = response.meta['remaining']
    request.meta['count'] = response.meta['count'] + 25
    return request
  
  def _generate_next_dept_request(self, response):
    selector = Selector(text = response.body)
    vars = self._generate_vars(selector)
    
    count = response.meta['count'] + len(selector.css("tr[id^='DESCR100']"))
    self.logger.debug('Found: %s courses for %s', str(count), response.meta['dept'])
    
    if len(response.meta['remaining']) > 0:
      dept = response.meta['remaining'][0]
      
      vars['ICAction'] =  'UC_CLSRCH_WRK2_SEARCH_BTN'
  
      vars['UC_CLSRCH_WRK2_SUBJECT'] = dept
      
      request = FormRequest(CourseSearchSpider.COURSE_SEARCH_URL, self._parse_department_data, formdata = vars)
      request.meta['dept'] = dept
      request.meta['remaining'] = response.meta['remaining'][1:]
      request.meta['count'] = 0      
      return request
    else:
      return None

  def _parse_section(self, row):
    course_name = row.css("span[id^='UC_CLSRCH_WRK_UC_CLASS_TITLE']::text").extract_first()
    course_descriptor = row.css("div[id^='win0divUC_RSLT_NAV_WRK_HTMLAREA'] div div::text").extract_first()
    if course_descriptor:
      match = self.descriptor_regex.match(course_descriptor)
      course = Course(match.group('id'))  # we can expand on this from the data provided
      section = Section(
        id=match.group('section'),
        name=course_name,
        units=None,
        instructors=[],
        schedule=None,
        type=match.group('type'),
        enrollment=[0, 0],
        location=None,
        course=course,
      )
      return {'section': section}
    return None
    
    
#This class handles the monotonoically increasing ICStateNum request field
class StateManagerMiddleware(object):
  def __init__(self):
    self.counter = 1
  
  def process_request(self, request, spider):
    if request.headers.get('Content-Type') == b'application/x-www-form-urlencoded':
      parsedBody = urllib.parse.parse_qs(request.body.decode("utf-8"), keep_blank_values=True)
      parsedBody['ICStateNum'] = [str(self.counter)]
      self.counter += 1
      request.replace(body=urllib.parse.urlencode(parsedBody))
      
  def process_response(self, request, response, spider):
    input = response.selector.css("input[name='ICStateNum']").xpath('@value').extract_first()
    if input:
      self.counter = int(input)
    return response
        