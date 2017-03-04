class Section(object):
    def __init__(self, id, course=None, name=None, units=None, instructors=[], schedule=None, type=None, enrollment=None, location=None):
        self.id = id
        self.course = course
        self.notes = []
        self.name = name
        self.units = units
        self.instructors = instructors
        self.schedule = schedule
        self.type = type
        self.enrollment = enrollment
        self.location = location
        self.primaries = []
        self.secondaries = []

    def __str__(self):
        return '%s %s %s' % (self.id, self.primaries, self.secondaries)

    def __repr__(self):
        return '<%s>' % str(self)
