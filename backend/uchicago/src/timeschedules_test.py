import unittest
import re
import requests

from . import Course
from . import Term
from . import timeschedules


class TestTimeschedules(unittest.TestCase):
    def test_get_terms(self):
        terms = list(timeschedules.get_terms())
        self.assertGreater(len(terms), 0)
        self.assertEqual(terms[-1][0], Term('Autumn 2002'))
        self.assertEqual(terms[-1][1], '46')
        for term, value in terms:
            self.assertIsInstance(term, Term)
            self.assertIsNotNone(value)
            self.assertGreater(len(value), 0)

    def test_get_department_urls(self):
        departments = list(timeschedules.get_department_urls('27'))
        self.assertEqual(len(departments), 139)
        self.assertEqual(list(sorted(departments))[0][0], 'ANCC')
        self.assertEqual(
            list(sorted(departments))[0][1],
            'http://timeschedules.uchicago.edu/view.php?dept=ANCC&term=27')

    def test_parse_department_graduate_and_undergraduate(self):
        results = timeschedules.parse_department(
            'http://timeschedules.uchicago.edu/view.php?dept=CMST&term=27')
        results.sort()
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0][0], Course('CMST 27600'))
        self.assertEqual(results[1][0], Course('CMST 37600'))
        self.assertEqual(list(results[0][1].keys()), ['91'])
        self.assertEqual(list(results[1][1].keys()), ['91'])
        for key, value in results:
            self.assertEqual(value['91'].notes,
                             ['Course meets 7/11-7-29 (3 weeks).'])


if __name__ == '__main__':
    unittest.main()
