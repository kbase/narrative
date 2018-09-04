from clustergrammer_widget import *
import pandas as pd

import biokbase.narrative.clients as clients


def view_as_clustergrammer(ws_ref, col_categories=(), row_categories=(), normalize_on=None):
    """
    This function returns an interactive clustergrammer widget for a specified object. Data type
    must contain a 'data' key with a FloatMatrix2D type value
    :param ws_ref: Object workspace reference
    :param col_categories: iterable with the permitted factors from the col_conditionset.
        Defaults to all factors.
    :param row_categories: iterable with the permitted categories from the row_conditionset.
        Defaults to all factors.
    :param normalize_on: If provided, the matrix will be converted to zscores normalized on the
        'row' or 'column' axis
    :return:
    """
    assert isinstance(col_categories, (tuple, set, list))
    assert isinstance(row_categories, (tuple, set, list))
    assert normalize_on in {None, "row", "column"}

    generic_df = _get_df(ws_ref, col_categories, row_categories)

    net = Network(clustergrammer_widget)
    net.df_to_dat({'mat': generic_df})
    if normalize_on:
        net.normalize(axis=normalize_on)
    net.cluster(enrichrgram=False)
    return net.widget()


def _get_df(ws_ref, col_categories, row_categories):
    """Gets a dataframe from the WS object"""
    ws = clients.get('workspace')
    generic_data = ws.get_objects2({'objects': [{'ref': ws_ref}]})['data'][0]['data']
    if not _is_compatible_matrix(generic_data):
        raise ValueError("{} is not a compatible data type for this viewer. Data type must "
                         "contain a 'data' key with a FloatMatrix2D type value".format(ws_ref))
    cols = _get_categories(generic_data['data']['col_ids'],
                           generic_data.get('col_conditionset_ref'),
                           generic_data.get('col_mapping'),
                           col_categories)
    rows = _get_categories(generic_data['data']['row_ids'],
                           generic_data.get('row_conditionset_ref'),
                           generic_data.get('row_mapping'),
                           row_categories)
    return pd.DataFrame(data=generic_data['data']['values'], columns=cols, index=rows)


def _is_compatible_matrix(obj):
    try:
        assert 'data' in obj
        assert 'col_ids' in obj['data']
        assert 'row_ids' in obj['data']
        assert 'values' in obj['data']
    except AssertionError:
        return False
    return True


def _get_categories(ids, conditionset_ref=None, mapping=None, whitelist=()):
    """Creates the correct kind of multi-factor index for clustergrammer display"""
    if not conditionset_ref:
        return ids
    cat_list = []
    ws = clients.get('workspace')
    condition_data = ws.get_objects2({'objects': [{'ref': conditionset_ref}]})['data'][0]['data']

    if not mapping:
        mapping = {x: x for x in ids}
    whitelist = set(whitelist)

    for _id in ids:
        try:
            condition_values = condition_data['conditions'][mapping[_id]]
        except KeyError:
            if _id not in mapping:
                raise ValueError("Row or column id {} is not in the provided mapping".format(_id))
            raise ValueError("ConditionSet {} has no condition {} which corresponds to row or "
                             "column id {} in the provided object.".format(conditionset_ref,
                                                                           mapping[_id], _id))
        cats = [_id]
        for i, val in enumerate(condition_values):
            cat_name = condition_data['factors'][i]['factor']
            if whitelist and cat_name not in whitelist:
                continue
            cats.append("{}: {}".format(cat_name, val))
        cat_list.append(tuple(cats))
    return cat_list





