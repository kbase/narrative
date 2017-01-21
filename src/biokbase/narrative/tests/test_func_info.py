"""
Tests for function info parsing.
"""
__author__ = 'dang'

import unittest
from biokbase.narrative.common.service import get_func_info, get_func_desc
from biokbase.narrative.common import kbtypes


class FakeFunction(object):
    """Float like a class-fly, sting like a function-bee.
    """
    def __init__(self, doc):
        self.__doc__ = doc


empty_info = {'params': [], 'output': None,
              'vis': {'embed_widget': True,
                      'input_widget': None,
                      'output_widget': None}}


class MyTestCase(unittest.TestCase):
    def _combine(self, params, output, vis):
        return {'params': params,
                'output': output,
                'vis': vis}

    def test_get_func_info(self):
        self.maxDiff = None

        finfo = lambda doc: self._combine(*get_func_info(FakeFunction(doc)))
        fdoc = lambda doc: get_func_desc(FakeFunction(doc))

        # dead simple one
        s = """Function description."""
        #print("@@info: {}".format(finfo(s)))
        self.assertEqual(finfo(s), empty_info)
        self.assertEqual(fdoc(s), s)

        # fuller one
        s = """Function description.

        :param p1: Foo
        :type p1: kbtypes.Unicode
        :default p1: Hello, world
        :return: Result
        :rtype: kbtypes.Unicode
        """
        expect = empty_info.copy()
        expect_p1 = kbtypes.Unicode("Hello, world", ui_name="p1", desc="Foo")
        expect_output = kbtypes.Unicode(desc="Result")
        got = finfo(s)
        got_p1 = got['params'][0]
        for key in 'ui_name', 'desc':
            got_key = got_p1.get_metadata(key)
            expect_key = expect_p1.get_metadata(key)
            self.assertEqual(got_key, expect_key)
        self.assertEqual(got_p1.get_default_value(), expect_p1.get_default_value())
        got_output = got['output']
        for key in ('desc',):
            got_key = got_output.get_metadata(key)
            expect_key = expect_output.get_metadata(key)
            self.assertEqual(got_key, expect_key)

if __name__ == '__main__':
    unittest.main()
