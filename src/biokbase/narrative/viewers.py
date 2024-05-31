"""Specialised viewers for the narrative."""

from typing import Any

import clustergrammer_widget
import pandas as pd
from biokbase.narrative import clients
from biokbase.narrative.system import system_variable
from clustergrammer_widget.clustergrammer import Network

# from clustergrammer2 import CGM2, Network


def view_as_clustergrammer(
    ws_ref: str,
    col_categories: tuple | set | list | None = (),
    row_categories: tuple | set | list | None = (),
    normalize_on: str | None = None,
):
    """This function returns an interactive clustergrammer widget for a specified object.

    Data type must contain a 'data' key with a FloatMatrix2D type value
    :param ws_ref: Object workspace reference
    :param col_categories: iterable with the permitted factors from the col_attributemapping.
        Defaults to all factors, pass None to exclude.
    :param row_categories: iterable with the permitted categories from the row_attributemapping.
        Defaults to all factors, pass None to exclude.
    :param normalize_on: If provided, the matrix will be converted to z-scores normalized on the
        'row' or 'column' axis
    :return:
    """
    errors = []
    if not isinstance(col_categories, tuple | set | list):
        errors.append("col_categories must be a tuple, set, or list")
    if not isinstance(row_categories, tuple | set | list):
        errors.append("row_categories must be a tuple, set, or list")
    if normalize_on not in {None, "row", "column"}:
        errors.append("normalize_on must be 'row', 'column' or None")

    if errors:
        error_msg = "Error with clustergrammer arguments:\n" + "\n".join(errors)
        raise AssertionError(error_msg)

    generic_df = get_df(ws_ref, col_categories, row_categories, True)

    net = Network(clustergrammer_widget)
    # load pandas dataframe
    net.load_df(generic_df)
    if normalize_on:
        net.normalize(axis=normalize_on)
    net.cluster()
    return net.widget()


def get_df(
    ws_ref: str,
    col_attributes: tuple | set | list | None = (),
    row_attributes: tuple | set | list | None = (),
    clustergrammer: bool = False,
) -> pd.DataFrame:
    """Gets a dataframe from the WS object.

    :param ws_ref: The Workspace reference of the 2DMatrix containing object
    :param col_attributes: Which column attributes should appear in the resulting DataFrame as a
        multiIndex. Defaults to all attributes, pass None to use a simple index of only ID.
    :param row_attributes: Which row attributes should appear in the resulting DataFrame as a
        multiIndex. Defaults to all attributes, pass None to use a simple index of only ID.
    :param clustergrammer: Returns a DataFrame with Clustergrammer compatible indices and columns.
        Defaults to False.
    :return: A Pandas DataFrame
    """
    ws = clients.get("workspace")
    if "/" not in ws_ref:
        ws_ref = f"{system_variable('workspace')}/{ws_ref}"
    generic_data = ws.get_objects2({"objects": [{"ref": ws_ref}]})["data"][0]["data"]
    if not _is_compatible_matrix(generic_data):
        err_msg = f"{ws_ref} is not a compatible data type for this viewer. Data type must contain a 'data' key with a FloatMatrix2D type value"
        raise ValueError(err_msg)
    cols = _get_categories(
        generic_data["data"]["col_ids"],
        ws_ref,
        generic_data.get("col_attributemapping_ref"),
        generic_data.get("col_mapping"),
        col_attributes,
        clustergrammer,
    )
    rows = _get_categories(
        generic_data["data"]["row_ids"],
        ws_ref,
        generic_data.get("row_attributemapping_ref"),
        generic_data.get("row_mapping"),
        row_attributes,
        clustergrammer,
    )
    return pd.DataFrame(data=generic_data["data"]["values"], columns=cols, index=rows)


def _is_compatible_matrix(obj: dict[str, Any]) -> bool:
    """Check that obj is matrix-like."""
    if (
        "data" in obj
        and "col_ids" in obj["data"]
        and "row_ids" in obj["data"]
        and "values" in obj["data"]
    ):
        return True
    return False


def _get_categories(
    ids: list[str],
    matrix_ref: str,
    attributemapping_ref: str | None = None,
    mapping: dict[str, str] | None = None,
    whitelist: tuple | set | list | None = (),
    clustergrammer: bool = False,
) -> list[str] | list[tuple[str]] | pd.MultiIndex:
    """Creates the correct kind of multi-factor index for clustergrammer display."""
    if not attributemapping_ref or whitelist is None:
        return ids
    cat_list = []
    ws = clients.get("workspace")
    attribute_data = ws.get_objects2(
        {"objects": [{"ref": matrix_ref + ";" + attributemapping_ref}]}
    )["data"][0]["data"]

    if not mapping:
        mapping = {x: x for x in ids}
    whitelist = set(whitelist)

    for _id in ids:
        try:
            attribute_values = attribute_data["instances"][mapping[_id]]
        except KeyError as ke:
            if _id not in mapping:
                msg = f"Row or column id {_id} is not in the provided mapping"
                raise ValueError(msg) from ke
            msg = (
                f"AttributeMapping {attributemapping_ref} has no attribute {mapping[_id]} which corresponds to row or "
                f"column id {_id} in the provided object."
            )
            raise ValueError(msg) from ke
        cats = [_id]
        for i, val in enumerate(attribute_values):
            cat_name = attribute_data["attributes"][i]["attribute"]
            if whitelist and cat_name not in whitelist:
                continue
            if clustergrammer:
                cats.append(f"{cat_name}: {val}")
            else:
                cats.append(val)
        cat_list.append(tuple(cats))

    if clustergrammer:
        return cat_list

    attribute_names = [
        x["attribute"]
        for x in attribute_data["attributes"]
        if not whitelist or x["attribute"] in whitelist
    ]
    return pd.MultiIndex.from_tuples(cat_list, names=["ID", *attribute_names])
