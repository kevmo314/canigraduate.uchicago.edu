import collections
import re
import scrapydo

from .course import Course
from .section import Section

from .coursesearch_spider import CourseSearchSpider

import scrapy

class CourseSearch(object):
  init = False
  def __init__(self, label, id):
    if not CourseSearch.init:
      scrapydo.setup()
      CourseSearch.init = True
    self.label = label
    self.id = id
    
  @property
  def courses(self):
  
    settings = {
        'USER_AGENT': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)',
        'DOWNLOADER_MIDDLEWARES': {
            'src.coursesearch_spider.StateManagerMiddleware': 543,
        },
        'LOG_LEVEL': 'WARNING'
    }
    
    scrapy.utils.log.configure_logging(settings)
    
    
    spider = CourseSearchSpider
    ret = scrapydo.run_spider(spider, settings=settings, label = self.label, id = self.id)
    
    courses = collections.defaultdict(dict)
    
    for item in ret:
      courses[item['section'].course][item['section'].id] = item['section']
    
    return courses

if __name__ == '__main__':
  print(CourseSearch('Winter 2017', '2172').courses)
  