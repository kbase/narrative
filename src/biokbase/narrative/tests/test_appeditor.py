"""
Some tests for the App Editor module.
"""
import unittest
from biokbase.narrative.appeditor import generate_app_cell
import json
from .util import ConfigTests


class AppEditorTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config = ConfigTests()
        cls.specs_list = config.load_json_file(config.get("specs", "app_specs_file"))
        cls.spec_json = config.load_json_file(config.get("specs", "simple_spec_json"))
        with open(config.file_path(config.get("specs", "simple_display_yaml"))) as f:
            cls.display_yaml = f.read()
            f.close()

    def test_gen_app_cell_post_validation(self):
        js = generate_app_cell(validated_spec=self.specs_list[0])
        self.assertIsNotNone(js)

    def test_gen_app_cell_pre_valid(self):
        js = generate_app_cell(
            spec_tuple=(json.dumps(self.spec_json), self.display_yaml)
        )
        self.assertIsNotNone(js)
        self.assertIsNotNone(js.data)
        self.assertIn(
            "A description string, with &quot;quoted&quot; values, shouldn&apos;t fail.",
            js.data,
        )
        self.assertIn("Test Simple Inputs with &quot;quotes&quot;", js.data)
        self.assertIn("A simple test spec with a single &apos;input&apos;.", js.data)

    def test_gen_app_cell_fail_validation(self):
        with self.assertRaises(Exception):
            generate_app_cell(spec_tuple=("{}", self.display_yaml))
