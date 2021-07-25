define(['jquery', 'widgets/common/RenderIn'], ($, RenderIn) => {
    'use strict';

    const { $TextIn } = RenderIn;

    function $RenderJSONArray(data) {
        const $rows = data.map((value, index) => {
            return $('<tr>').append(
                $('<th>').css('color', 'rgba(150, 150, 150, 1)').text(String(index)),
                $('<td>').addClass('fa fa-arrow-right'),
                $('<td>').html($JSONView(value))
            );
        });
        return $('<table>').addClass('table table-striped').html($('<tbody>').append($rows));
    }

    function $RenderJSONObject(data) {
        const $rows = Object.entries(data).map(([key, value]) => {
            return $('<tr>').append(
                $('<th>').css('color', 'rgba(150, 150, 150, 1)').text(key),
                $('<td>').addClass('fa fa-arrow-right'),
                $('<td>').html($JSONView(value))
            );
        });
        return $('<table>').addClass('table table-striped').html($('<tbody>').append($rows));
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
