class TranscriptRecord(object):
    def __init__(self, section=None, grade=None, term=None):
        self.section = section
        self.grade = grade
        self.term = term

    @property
    def complete(self):
        return self.grade is not None

    def serialize(self):
        return {
            'term': self.term.id,
            'id': self.section.course.id,
            'section': self.section.id,
            'complete': self.complete,
            'quality': self.grade.quality if self.complete else None,
            'credit': self.grade.credit if self.complete else None,
            'grade': self.grade.grade if self.complete else None,
            'gpa': self.grade.gpa if self.complete else None
        }
