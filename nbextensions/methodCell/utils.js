/*global define*/
/*jslint white:true,browser:true*/

define([
    'kb_common/html',
    'bootstrap'
], function (html) {
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

    return {
        makePanel: makePanel,
        buildPanel: buildPanel,
        getElement: getElement,
        createMeta: createMeta,
        getMeta: getMeta,
        setMeta: setMeta
    };

});