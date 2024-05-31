"""Tests for the viewer module."""

import pandas as pd
import pytest
from biokbase.narrative import viewers

ATTRIBUTE_SET_REF = "36095/73/1"
GENERIC_REF = "36095/74/1"
EXPRESSION_MATRIX_REF = "28852/11/1"


@pytest.mark.parametrize("arg_type", ["col_categories", "row_categories", "normalize_on"])
def test_bad_view_as_clustergrammer_params_generic_ref(arg_type: str) -> None:
    with pytest.raises(
        AssertionError,
        match=f"Error with clustergrammer arguments:\n{arg_type}",
    ):
        viewers.view_as_clustergrammer(GENERIC_REF, **{arg_type: "Time"})  # type: ignore[arg-type]


@pytest.mark.vcr()
def test_bad_view_as_clustergrammer_params_attr_set_ref() -> None:
    with pytest.raises(ValueError, match="not a compatible data type"):
        viewers.view_as_clustergrammer(ATTRIBUTE_SET_REF)


@pytest.mark.vcr()
@pytest.mark.skip("Clustergrammer widget is currently broken")
def test_view_as_clustergrammer() -> None:
    assert (
        str(type(viewers.view_as_clustergrammer(GENERIC_REF)))
        == "<class 'clustergrammer2.example.CGM2'>"
    )


@pytest.mark.vcr()
def test__get_categories() -> None:
    ids = ["WRI_RS00010_CDS_1", "WRI_RS00015_CDS_1", "WRI_RS00025_CDS_1"]
    mapping = {
        "WRI_RS00010_CDS_1": "test_row_instance_1",
        "WRI_RS00015_CDS_1": "test_row_instance_2",
        "WRI_RS00025_CDS_1": "test_row_instance_3",
    }
    index = [
        (
            "WRI_RS00010_CDS_1",
            "test_attribute_1: 1",
            "test_attribute_2: 4",
            "test_attribute_3: 7",
        ),
        (
            "WRI_RS00015_CDS_1",
            "test_attribute_1: 2",
            "test_attribute_2: 5",
            "test_attribute_3: 8",
        ),
        (
            "WRI_RS00025_CDS_1",
            "test_attribute_1: 3",
            "test_attribute_2: 6",
            "test_attribute_3: 9",
        ),
    ]
    filtered_index = [
        ("WRI_RS00010_CDS_1", "test_attribute_1: 1"),
        ("WRI_RS00015_CDS_1", "test_attribute_1: 2"),
        ("WRI_RS00025_CDS_1", "test_attribute_1: 3"),
    ]
    multi_index = pd.MultiIndex(
        levels=[
            ["WRI_RS00010_CDS_1", "WRI_RS00015_CDS_1", "WRI_RS00025_CDS_1"],
            ["1", "2", "3"],
        ],
        codes=[[0, 1, 2], [0, 1, 2]],
        names=["ID", "test_attribute_1"],
    )
    assert ids == viewers._get_categories(ids, GENERIC_REF)  # noqa: SLF001

    with pytest.raises(ValueError, match="not in the provided mapping"):
        viewers._get_categories(["boo"], GENERIC_REF, ATTRIBUTE_SET_REF, mapping)  # noqa: SLF001

    with pytest.raises(ValueError, match="has no attribute"):
        viewers._get_categories(["boo"], GENERIC_REF, ATTRIBUTE_SET_REF)  # noqa: SLF001

    assert index == viewers._get_categories(  # noqa: SLF001
        ids,
        GENERIC_REF,
        ATTRIBUTE_SET_REF,
        mapping,
        clustergrammer=True,
    )

    pd.testing.assert_index_equal(
        multi_index,
        viewers._get_categories(  # noqa: SLF001
            ids,
            GENERIC_REF,
            ATTRIBUTE_SET_REF,
            mapping,
            {"test_attribute_1"},
        ),
    )
    assert filtered_index == viewers._get_categories(  # noqa: SLF001
        ids,
        GENERIC_REF,
        ATTRIBUTE_SET_REF,
        mapping,
        {"test_attribute_1"},
        clustergrammer=True,
    )


@pytest.mark.vcr()
def test_get_df_generic_ref() -> None:
    res = viewers.get_df(GENERIC_REF)
    assert isinstance(res, pd.DataFrame)
    assert res.shape == (3, 4)
    assert isinstance(res.index, pd.MultiIndex)


@pytest.mark.vcr()
def test_get_df_generic_ref_none() -> None:
    res = viewers.get_df(GENERIC_REF, None, None)
    assert isinstance(res, pd.DataFrame)
    assert res.shape == (3, 4)
    assert isinstance(res.index, pd.Index)


@pytest.mark.vcr()
def test_get_df_generic_ref_clustergrammer() -> None:
    res = viewers.get_df(GENERIC_REF, clustergrammer=True)
    assert isinstance(res, pd.DataFrame)
    assert res.shape == (3, 4)
    assert isinstance(res.index, pd.Index)


@pytest.mark.vcr()
def test_get_df_generic_ref_expr_matrix() -> None:
    res = viewers.get_df(EXPRESSION_MATRIX_REF)
    assert isinstance(res, pd.DataFrame)
    assert res.shape == (4297, 16)
    assert isinstance(res.index, pd.Index)
