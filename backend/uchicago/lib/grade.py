GPA_MAP = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
}

class Grade(object):
    def __init__(self, grade):
        self.grade = grade

    @property
    def gpa(self):
        grade = self.grade if self.grade[0] != 'I' else self.grade[1:]
        return GPA_MAP.get(grade)            

    @property
    def quality(self):
        return self.gpa is not None

    @property
    def credit(self):
        return self.grade[-1] == 'P' or (self.quality and self.gpa > 0)
