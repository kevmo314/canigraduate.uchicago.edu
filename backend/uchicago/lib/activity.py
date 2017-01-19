class Activity(object):
    def __init__(self):
        pass

    def __str__(self):
        return self.type if self.type else self.instructor

    def __repr__(self):
        return '<%s>' % str(self)

class PrimaryActivity(Activity):
    def __init__(self, instructor, schedule, type, location):
        self.instructor = instructor
        self.schedule = schedule
        self.type = type
        self.location = location

class SecondaryActivity(Activity):
    def __init__(self, id, instructor, schedule, type, location, enrollment):
        self.id = id
        self.instructor = instructor
        self.schedule = schedule
        self.type = type
        self.location = location
        self.enrollment = enrollment
