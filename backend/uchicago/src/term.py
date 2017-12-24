import functools


@functools.total_ordering
class Term(object):
    def __init__(self, term):
        self.term = term

    @property
    def ordinal(self):
        return 4 * int(self.term[-4:]) + [
            'Winter', 'Spring', 'Summer', 'Autumn'
        ].index(self.term[:6])

    def __eq__(self, other):
        return self.term == other.term

    def __hash__(self):
        return self.ordinal

    def __lt__(self, other):
        return self.ordinal < other.ordinal

    def __str__(self):
        return self.term

    def __repr__(self):
        return '<%s>' % str(self)


MINIMUM_TERM = Term('Autumn 2002').ordinal