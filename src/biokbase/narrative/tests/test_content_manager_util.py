import unittest
from biokbase.narrative.contents.manager_util import base_model

class ManagerUtilTestCase(unittest.TestCase):
    def test_base_model(self):
        name = 'foo'
        path = 'bar'
        model = base_model(name, path)
        self.assertIn('name', model)
        self.assertEqual(model['name'], name)
        self.assertIn('path', model)
        self.assertEqual(model['path'], path)
        self.assertIn('last_modified', model)
        self.assertEqual(model['last_modified'], '00-00-0000')
        self.assertIn('created', model)
        self.assertEqual(model['created'], '00-00-0000')
        self.assertIn('content', model)
        self.assertIsNone(model['content'])
        self.assertIn('format', model)
        self.assertIsNone(model['format'])
        self.assertIn('mimetype', model)
        self.assertIsNone(model['mimetype'])
        self.assertIn('writable', model)
        self.assertFalse(model['writable'])
        self.assertIn('type', model)
        self.assertIsNone(model['type'])
