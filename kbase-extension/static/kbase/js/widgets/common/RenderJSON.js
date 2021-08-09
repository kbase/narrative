define(['jquery'], ($) => {
    'use strict';

    /**
     *
     * @typedef {(string | boolean | number | null | JSONObject | JSONArray)} JSONValue
     * @typedef {Object} JSONObject
     * @typedef {JSONValue[]} JSONArray
     */

    /**
     * Renders an array of JSON-compatible values as a rotated table, in which the first column
     * is the array index, and the second column is the array value.
     * The value is rendered with `$renderJSON`, so it is essentially recursive (in that it may
     * call `$renderJSONArray` in turn.)
     *
     * @param {JSONValue[]} data - An array of JSON-compatible values
     * @returns {jQuery} A jQuery object composed of a table representing the provided array
     */
    function $renderJSONArray(data) {
        const $rows = data.map((value, index) => {
            return $('<tr>').append(
                $('<th>').css('color', 'rgba(150, 150, 150, 1)').text(String(index)),
                $('<td>').append($renderJSON(value))
            );
        });
        return $('<table>')
            .addClass('table table-striped')
            .append($('<tbody>').append(...$rows));
    }

    /**
     * Renders a table containing the key-value pairs of a JSON-compatible object. The table's first column
     * contains the key, the second the value. The value is rendered with `$renderJSON`, so it is essentially
     * recursive (in that it may call `$renderJSONObject` in turn.)
     *
     * @param {Object} data - An simple object ({}.constructor) whose properties are JSON-compatible values
     * @returns {jQuery} A jQuery object representing a table of an object's key-value pairs, in
     * which the first column is the key and the second the value.
     */
    function $renderJSONObject(data) {
        const $rows = Object.entries(data).map(([key, value]) => {
            return $('<tr>').append(
                $('<th>').css('color', 'rgba(150, 150, 150, 1)').text(key),
                $('<td>').append($renderJSON(value))
            );
        });
        return $('<table>')
            .addClass('table table-striped')
            .append($('<tbody>').append(...$rows));
    }

    function $renderJSONString(data) {
        return $('<div>').text(data);
    }

    function $renderJSONNumber(data) {
        return $('<div>').text(String(data));
    }

    function $renderJSONBoolean(data) {
        return $('<code>').text(String(data));
    }

    function $renderJSONNull() {
        return $('<code>').text('null');
    }

    /**
     * Fully renders a JSON-compatible value. Since a value may be an array or object, which are recursively
     * rendered using functions in this module, the final render may be a nested set of json values.
     *
     * @param {JSONValue} data - A JSON-compatible value to render
     * @returns {jQuery} A jQuery object representing the rendering of the entire JSON value, which may
     * be nested renderings of arrays and objects of JSON values.
     */
    function $renderJSON(data) {
        switch (typeof data) {
            case 'string':
                return $renderJSONString(data);
            case 'number':
                return $renderJSONNumber(data);
            case 'boolean':
                return $renderJSONBoolean(data);
            case 'object':
                if (data === null) {
                    return $renderJSONNull();
                }
                if (data instanceof Array) {
                    return $renderJSONArray(data);
                } else {
                    // We accept all other types of objects here; note that this may fail
                    // for non-plain objects
                    return $renderJSONObject(data);
                }
            case 'undefined':
                // ignore
                return $('');
            default:
                return $renderJSONString(`not representable: "${typeof data}"`);
        }
    }

    /**
     *
     * @external "jQuery"
     * @see {@link https://api.jquery.com/Types/#jQuery}
     */

    return Object.freeze({
        $renderJSON,
        $renderJSONArray,
        $renderJSONObject,
    });
});
