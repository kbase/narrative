import unittest

from biokbase.narrative.contents.manager_util import base_model


class ManagerUtilTestCase(unittest.TestCase):
    def test_base_model(self):
        name = "foo"
        path = "bar"
        model = base_model(name, path)
        assert "name" in model
        assert model["name"] == name
        assert "path" in model
        assert model["path"] == path
        assert "last_modified" in model
        assert model["last_modified"] == "00-00-0000"
        assert "created" in model
        assert model["created"] == "00-00-0000"
        assert "content" in model
        assert model["content"] is None
        assert "format" in model
        assert model["format"] is None
        assert "mimetype" in model
        assert model["mimetype"] is None
        assert "writable" in model
        assert not model["writable"]
        assert "type" in model
        assert model["type"] is None
