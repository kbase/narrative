from biokbase.narrative.common.kvp import parse_kvp


def test_parse_kvp() -> None:
    for user_input, text, kvp in (
        ("foo", "foo", {}),
        ("name=val", "", {"name": "val"}),
        ("a name=val boy", "a boy", {"name": "val"}),
    ):
        rkvp = {}
        rtext = parse_kvp(user_input, rkvp)
        assert text == rtext
        assert kvp == rkvp
