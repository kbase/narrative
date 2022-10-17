define(['jquery', 'widgets/common/RenderIn'], ($, RenderIn) => {
    'use strict';

    const { $TextIn } = RenderIn;

    function $RenderJSONArray(data) {
        const $rows = data.map((value, index) => {
            return $('<tr>')
                .addClass('Element')
                .append(
                    $('<th>').addClass('Index').text(String(index)),
                    $('<td>').html($('<span />').addClass('fa fa-arrow-right')),
                    $('<td>').html($JSONView(value))
                );
        });
        return $('<table>')
            .addClass('table table-striped JSONArray')
            .html($('<tbody>').append($rows));
    }

    function $RenderJSONObject(data) {
        const $rows = Object.entries(data).map(([key, value]) => {
            return $('<tr>')
                .addClass('Property')
                .append(
                    $('<th>').addClass('Key').text(key),
                    $('<td>').html($('<span />').addClass('fa fa-arrow-right')),
                    $('<td>').html($JSONView(value))
                );
        });
        return $('<table>')
            .addClass('table table-striped JSONObject')
            .html($('<tbody>').append($rows));
    }

    function $RenderNonJSON(data) {
        if (typeof data === 'object') {
            return $TextIn(`Not representable: ${typeof data} (${data.constructor.name})`);
        } else {
            return $TextIn(`Not representable: ${typeof data}`);
        }
    }

    function $JSONView(data) {
        switch (typeof data) {
            case 'string':
                return $TextIn(data);
            case 'number':
                return $TextIn(String(data));
            case 'boolean':
                return $TextIn(String(data));
            case 'object':
                if (data === null) {
                    return $TextIn('NULL');
                }
                if (Array.isArray(data)) {
                    return $RenderJSONArray(data);
                } else {
                    if (data.constructor === {}.constructor) {
                        return $RenderJSONObject(data);
                    } else {
                        return $RenderNonJSON(data);
                    }
                }
            default:
                return $RenderNonJSON(data);
        }
    }

    return $JSONView;
});
