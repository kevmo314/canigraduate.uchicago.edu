import re
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import ElementNotVisibleException

from coursesearch_driver import CourseSearchDriver
from course import Course
from section import Section

class CourseSearch(object):
  def __init__(self, label, id):
    self.label = label
    self.id = id
    self.driver = CourseSearchDriver()
    self._courses = {}

    self.descriptor_regex = re.compile(r"(?P<dept>[A-Z]+) (?P<id>[0-9]{5})\/(?P<section>[0-9]+) \[(?P<section_id>[0-9]+)\] - (?P<type>[A-Z]+)")

  def _search_shard(self, day, subj):
    select_subj = Select(self.driver.find_element_by_id("UC_CLSRCH_WRK2_SUBJECT"))
    select_subj.select_by_value(subj)
    self.driver.find_element_by_id("UC_CLSRCH_WRK2_SEARCH_BTN").click()
    self.driver.wait_until_loaded()

  def _parse_results(self):
    for i in range(25):  # max courses listed per page
      el = None
      try:
        el = self.driver.find_element_by_id("DESCR100$0_row_%s" % i)  # course row element
      except NoSuchElementException:  # n_courses on page < max
        pass

      if el is not None:
        course_name = el.find_element_by_id("UC_CLSRCH_WRK_UC_CLASS_TITLE$%s" % i).text
        course_row = el.find_element_by_id("win0divUC_RSLT_NAV_WRK_HTMLAREA$%s" % i)
        try:
          course_descriptor = course_row.find_element_by_css_selector("div").find_element_by_css_selector("div").text
          print(course_descriptor)
          match = self.descriptor_regex.match(course_descriptor)
          course = Course(match.group("id"))  # we can expand on this from the data provided
          section = Section(
              id=match.group("section_id"),
              name=course_name,
              units=None,
              instructor=None,
              schedule=None,
              type=match.group("type"),
              enrollment=[0, 0],
              location=None,
          )
          if match.group("id") in self._courses:
            self._courses[match.group("id")] = course
          else:
            pass  # add section
          print(section.__dict__)
        except NoSuchElementException:  # no courses match
          pass
    try:
      el = self.driver.find_element_by_id("UC_RSLT_NAV_WRK_SEARCH_CONDITION2")
      el.click()
      self.driver.wait_until_loaded()
      self._parse_results()
    except (NoSuchElementException, ElementNotVisibleException):  # end of results
      pass

  @property
  def courses(self):
    print(self.label, self.id)
    select_term = Select(self.driver.find_element_by_id("UC_CLSRCH_WRK2_STRM"))
    select_term.select_by_value(self.id)
    self.driver.wait_until_loaded()
    for day in ["MON", "TUES", "WED", "THURS", "FRI", "SAT", "SUN"]:
      subjs = [subj_opt.get_attribute("value") for subj_opt in self.driver.find_element_by_id("UC_CLSRCH_WRK2_SUBJECT").find_elements_by_css_selector("option")]
      subjs = [s for s in subjs if s]
      self.driver.find_element_by_id("UC_CLSRCH_WRK2_%s" % day).click()
      for subj in subjs:
        self._search_shard(day, subj)
        self._parse_results()
      self.driver.find_element_by_id("UC_CLSRCH_WRK2_%s" % day).click()
    return self._courses.iteritems()

if __name__ == "__main__":
  CourseSearch("Spring 2017", "2174").courses
