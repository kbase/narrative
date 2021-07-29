import clustergrammer_widget
from clustergrammer_widget.clustergrammer import Network

import pandas as pd

import biokbase.narrative.clients as clients
from biokbase.narrative.app_util import system_variable


def view_as_clustergrammer(
    ws_ref, col_categories=(), row_categories=(), normalize_on=None
):
    """
    This function returns an interactive clustergrammer widget for a specified object. Data type
    must contain a 'data' key with a FloatMatrix2D type value
    :param ws_ref: Object workspace reference
    :param col_categories: iterable with the permitted factors from the col_attributemapping.
        Defaults to all factors, pass None to exclude.
    :param row_categories: iterable with the permitted categories from the row_attributemapping.
        Defaults to all factors, pass None to exclude.
    :param normalize_on: If provided, the matrix will be converted to z-scores normalized on the
        'row' or 'column' axis
    :return:
    """
    assert isinstance(col_categories, (tuple, set, list))
    assert isinstance(row_categories, (tuple, set, list))
    assert normalize_on in {None, "row", "column"}

    generic_df = get_df(ws_ref, col_categories, row_categories, True)

    net = Network(clustergrammer_widget)
    net.df_to_dat({"mat": generic_df})
    if normalize_on:
        net.normalize(axis=normalize_on)
    net.cluster(enrichrgram=False)
    return net.widget()


def get_df(ws_ref, col_attributes=(), row_attributes=(), clustergrammer=False):
    """
    Gets a dataframe from the WS object

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
        ws_ref = "{}/{}".format(system_variable("workspace"), ws_ref)
    generic_data = ws.get_objects2({"objects": [{"ref": ws_ref}]})["data"][0]["data"]
    if not _is_compatible_matrix(generic_data):
        raise ValueError(
            "{} is not a compatible data type for this viewer. Data type must "
            "contain a 'data' key with a FloatMatrix2D type value".format(ws_ref)
        )
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


def _is_compatible_matrix(obj):
    try:
        assert "data" in obj
        assert "col_ids" in obj["data"]
        assert "row_ids" in obj["data"]
        assert "values" in obj["data"]
    except AssertionError:
        return False
    return True


def _get_categories(
    ids,
    matrix_ref,
    attributemapping_ref=None,
    mapping=None,
    whitelist=(),
    clustergrammer=False,
):
    """Creates the correct kind of multi-factor index for clustergrammer display"""
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
        except KeyError:
            if _id not in mapping:
                raise ValueError(
                    "Row or column id {} is not in the provided mapping".format(_id)
                )
            raise ValueError(
                "AttributeMapping {} has no attribute {} which corresponds to row or "
                "column id {} in the provided object.".format(
                    attributemapping_ref, mapping[_id], _id
                )
            )
        cats = [_id]
        for i, val in enumerate(attribute_values):
            cat_name = attribute_data["attributes"][i]["attribute"]
            if whitelist and cat_name not in whitelist:
                continue
            if clustergrammer:
                cats.append("{}: {}".format(cat_name, val))
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
    return pd.MultiIndex.from_tuples(cat_list, names=["ID"] + attribute_names)
