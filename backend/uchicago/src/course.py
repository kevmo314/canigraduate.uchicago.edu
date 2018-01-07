import collections
import re
import requests

COURSE_BLOCK_DESC = re.compile(r'courseblockdesc">(.+?)<',
                               re.MULTILINE | re.DOTALL)


class Course(object):
    def __init__(self, id):
        self.id = id
        self.notes = []

    def __eq__(self, other):
        return self.id == other.id

    def __lt__(self, other):
        return self.id < other.id

    def __hash__(self):
        return hash(self.id)

    def __str__(self):
        return self.id

    def __repr__(self):
        return '<%s>' % str(self)
