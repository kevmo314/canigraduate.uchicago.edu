import unittest
import re
import requests

from .timeschedules_fsm import FSM


class TestTimeschedulesParser(unittest.TestCase):
    def _construct_fsm(self, string):
        fsm = FSM([])

        def stub(*args, **kwargs):
            return string

        fsm.next_string = stub
        return fsm

    def test_next_schedule(self):
        self.assertEqual([], self._construct_fsm("ARRARR").next_schedule())
        self.assertEqual(
            [[2190, 2240], [5070, 5120], [7950, 8000]],
            self._construct_fsm("MWF12:30PM-1:20PM").next_schedule())
        self.assertEqual(
            [[3510, 3590], [6390, 6470]],
            self._construct_fsm("TTh10:30AM-11:50AM").next_schedule())
        self.assertEqual(
            [[3510, 3590]],
            self._construct_fsm("Tue10:30AM-11:50AM").next_schedule())
        self.assertEqual(
            [[3510, 3590]],
            self._construct_fsm("U10:30AM-11:50AM").next_schedule())
        self.assertEqual(
            [[1890, 2360], [3330, 3800], [4770, 5240], [6210, 6680],
             [7650, 8120]],
            self._construct_fsm("M-F7:30AM-3:20PM").next_schedule())
        self.assertEqual(
            [[9420, 9600]],
            self._construct_fsm("Sat1:00PM-4:00PM").next_schedule())
        self.assertEqual(
            [[2190, 2240], [5070, 5120], [6510, 6560], [7950, 8000]],
            self._construct_fsm("MWHF12:30PM-1:20PM").next_schedule())
        self.assertEqual(
            [[2190, 2240], [5070, 5120], [6510, 6560], [7950, 8000]],
            self._construct_fsm("MWRF12:30PM-1:20PM").next_schedule())
        self.assertEqual(
            [[2190, 2240], [5070, 5120], [6510, 6560], [7950, 8000]],
            self._construct_fsm("MWTHF12:30PM-1:20PM").next_schedule())
        self.assertEqual(
            [[6660, 6830]],
            self._construct_fsm("Thu3:00PM-5:50PM").next_schedule())


if __name__ == '__main__':
    unittest.main()
