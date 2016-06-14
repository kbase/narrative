/*global define*/
/*jslint white:true,browser:true*/

define([
    'kb_common/html',
    'kb_common/format',
    './props',
    'bootstrap'
], function (html, format, Props) {
    'use strict';
    var t = html.tag,
        div = t('div');

    function makePanel(title, elementName) {
        return  div({class: 'panel panel-primary'}, [
            div({class: 'panel-heading'}, [
                div({class: 'panel-title'}, title)
            ]),
            div({class: 'panel-body'}, [
                div({dataElement: elementName, class: 'container-fluid'})
            ])
        ]);
    }

    function buildPanel(args) {
        var style = {}, type = args.type || 'primary';
        if (args.hidden) {
            style.display = 'none';
        }
        return  div({class: 'panel panel-' + type, dataElement: args.name, style: style}, [
            div({class: 'panel-heading'}, [
                div({class: 'panel-title'}, args.title)
            ]),
            div({class: 'panel-body'}, [
                args.body
            ])
        ]);
    }

    function getElement(container, names) {
        var selector = names.map(function (name) {
            return '[data-element="' + name + '"]';
        }).join(' ');

        return container.querySelector(selector);
    }
    function createMeta(cell, initial) {
        var meta = cell.metadata;
        meta.kbase = initial;
        cell.metadata = meta;
    }
    function getMeta(cell, group, name) {
        if (!cell.metadata.kbase) {
            return;
        }
        if (name === undefined) {
            return cell.metadata.kbase[group];
        }
        if (!cell.metadata.kbase[group]) {
            return;
        }
        return cell.metadata.kbase[group][name];
    }
    function setMeta(cell, group, name, value) {
        /*
         * This funny business is because the trigger on setting the metadata
         * property (via setter and getter in core Cell object) is only invoked
         * when the metadata preoperty is actually set -- doesn't count if
         * properties of it are.
         */
        var temp = cell.metadata;
        // Handle the case of setting a group to an entire object
        if (value === undefined) {
            temp.kbase[group] = name;
        } else {
            if (!temp.kbase[group]) {
                temp.kbase[group] = {};
            }
            temp.kbase[group][name] = value;
        }
        cell.metadata = temp;
    }
    function pushMeta(cell, props, value) {
        var meta = Props.make(cell.metadata.kbase);
        meta.incrItem(props, value);
    }

    /*
     * Show elapsed time in a friendly fashion.
     */
    function pad(string, width, char, right) {
        if (!char) {
            char = '0';
        }
        if (typeof string === 'number') {
            string = String(string);
        }
        var padLen = width - string.length,
            padding = '', i;
        if (padLen <= 0) {
            return string;
        }
        for (i = 0; i < padLen; i += 1) {
            padding += char;
        }
        if (right) {
            return string + padding;
        }
        return padding + string;
    }
    function formatElapsedTime(value, defaultValue) {
        if (!value) {
            return defaultValue;
        }
        var temp = value;

        var units = [1000, 60, 60, 24].map(function (unit) {
            var unitValue = temp % unit;
            temp = (temp - unitValue) / unit;
            return unitValue;
        });

        return [[pad(units[3], 2), pad(units[2], 2), pad(units[1], 2)].join(':'), pad(units[0], 3)].join('.');
    }
    function formatTime(time) {
        if (time) {
            return format.niceElapsedTime(time);
        }
    }

    return {
        makePanel: makePanel,
        buildPanel: buildPanel,
        getElement: getElement,
        createMeta: createMeta,
        getMeta: getMeta,
        setMeta: setMeta,
        pushMeta: pushMeta,
        formatElapsedTime: formatElapsedTime,
        formatTime: formatTime
    };

});