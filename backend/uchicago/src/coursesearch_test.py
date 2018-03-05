import unittest
import re
import requests

from . import Course
from . import Term
from . import coursesearch


class TestCourseSearch(unittest.TestCase):
    def test_get_terms(self):
        return
        terms = list(coursesearch.get_terms())
        self.assertGreater(len(terms), 0)
        self.assertEqual(terms[0][0], Term('Autumn 2016'))
        self.assertEqual(terms[0][1], '2168')
        for term, value in terms:
            self.assertIsInstance(term, Term)
            self.assertIsNotNone(value)
            self.assertGreater(len(value), 0)

    def test_get_department_urls(self):
        return
        departments = list(coursesearch.get_department_urls('2168'))
        self.assertEqual(len(departments), 200 * 25)
        self.assertEqual(list(sorted(departments))[0][0], 'AANL')
        self.assertEqual(list(sorted(departments))[0][1], ('2168', 'AANL', 0))

    def test_parse_department_graduate_and_undergraduate(self):
        results = coursesearch.parse_department(('2168', 'ARAB', 0))
        results.sort()
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0][0], Course('ARAB 10101'))
        self.assertEqual(results[1][0], Course('ARAB 30551'))
        self.assertEqual(list(results[0][1].keys()), ['1'])
        self.assertEqual(list(results[1][1].keys()), ['1'])
        self.assertEqual(results[0][1]['1'].notes,
                         ['This class meets 6 hours per week.'])
        self.assertEqual(results[0][1]['1'].enrollment, ['15', '15'])
        self.assertEqual(results[1][1]['1'].notes, [])

    def test_parse_department_graduate_and_undergraduate_MATH(self):
        return
        results = coursesearch.parse_department(('2168', 'MATH', 0))
        results.sort()
        self.assertEqual(len(results), 5)
        self.assertEqual(results[0][1]['20'].enrollment, ['5', '24'])
        self.assertEqual(results[0][1]['20'].notes, ['Placements'])


if __name__ == '__main__':
    unittest.main()
