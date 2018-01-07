class Activity(object):
    def __init__(self):
        pass

    def __str__(self):
        return self.type if self.type else ','.join(self.instructors)

    def __repr__(self):
        return '<%s>' % str(self)


def serialize_schedule(x):
    return x[0] * 60 * 24 * 7 + x[1]


class PrimaryActivity(Activity):
    def __init__(self, instructors, schedule, type, location):
        self.instructors = instructors
        self.schedule = schedule
        self.type = type
        self.location = location

    def to_dict(self):
        return {
            'instructors': self.instructors,
            'schedule': [serialize_schedule(s) for s in self.schedule],
            'type': self.type,
            'location': self.location
        }


class SecondaryActivity(Activity):
    def __init__(self, id, instructors, schedule, type, location, enrollment):
        self.id = id
        self.instructors = instructors
        self.schedule = schedule
        self.type = type
        self.location = location
        self.enrollment = enrollment

    def to_dict(self):
        return {
            'instructors': self.instructors,
            'schedule': [serialize_schedule(s) for s in self.schedule],
            'type': self.type,
            'location': self.location,
            'enrollment': self.enrollment
        }
