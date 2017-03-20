class Activity(object):
    def __init__(self):
        pass

    def __str__(self):
        return self.type if self.type else ','.join(self.instructors)

    def __repr__(self):
        return '<%s>' % str(self)

class PrimaryActivity(Activity):
    def __init__(self, instructors, schedule, type, location):
        self.instructors = instructors
        self.schedule = schedule
        self.type = type
        self.location = location

class SecondaryActivity(Activity):
    def __init__(self, id, instructors, schedule, type, location, enrollment):
        self.id = id
        self.instructors = instructors
        self.schedule = schedule
        self.type = type
        self.location = location
        self.enrollment = enrollment
