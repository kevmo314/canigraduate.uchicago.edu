import collections
import re
import requests

COURSE_BLOCK_DESC = re.compile(r'courseblockdesc">(.+?)<',
                               re.MULTILINE | re.DOTALL)


class Course(object):
    def __init__(self, id):
        self.id = id
        self.notes = []
        self._description = None
        self._description_queried = False

    @property
    def description(self):
        if self._description_queried:
            return self._description
        #text = requests.get(
        #    'http://collegecatalog.uchicago.edu/ribbit/index.cgi?page=getcourse.rjs&code='
        #    + self.id).text
        #result = COURSE_BLOCK_DESC.search(text)
        #self._description = result.group(1).strip() if result else None
        #self._description_queried = True
        return self._description

    @description.setter
    def description(self, value):
        self._description = value
        self._description_queried = True

    def __eq__(self, other):
        return self.id == other.id

    def __hash__(self):
        return hash(self.id)

    def __str__(self):
        return self.id

    def __repr__(self):
        return '<%s>' % str(self)
