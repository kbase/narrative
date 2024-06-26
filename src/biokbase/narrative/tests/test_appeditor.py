"""Some tests for the App Editor module."""

import json
import re
import unittest

import pytest
from biokbase.narrative.appeditor import generate_app_cell
from biokbase.narrative.tests.util import ConfigTests


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
        assert js is not None

    def test_gen_app_cell_pre_valid(self):
        js = generate_app_cell(spec_tuple=(json.dumps(self.spec_json), self.display_yaml))
        assert js is not None
        assert js.data is not None
        assert (
            "A description string, with &quot;quoted&quot; values, shouldn&apos;t fail." in js.data
        )
        assert "Test Simple Inputs with &quot;quotes&quot;" in js.data
        assert "A simple test spec with a single &apos;input&apos;." in js.data

    def test_gen_app_cell_fail_validation(self):
        with pytest.raises(
            Exception,
            match=re.escape("Can't find sub-node [categories] within path [/] in spec.json"),
        ):
            generate_app_cell(spec_tuple=("{}", self.display_yaml))
