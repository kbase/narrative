/*global define*/
/*eslint-env browser*/

define([
    'jquery',
    'bluebird',
    'handlebars',
    'text!kbase/templates/readsSetEditor/widgetTemplate.html'
], function (
    $,
    Promise,
    Handlebars,
    Template
) {
    'use strict';

    function factory (config) {
        var container,
            parentBus = config.bus,
            cellBus = config.cellBus,
            model,
            setName = "",
            setDescription = "";

        function updateModel () {
            var stringInput = [
                'name:' + setName,
                'desc:' + setDescription
            ].join(', ');
            model.setItem('params.string_input', stringInput);
            cellBus.emit('editor-updated');
        }

        function createReadsObjectRow () {

        }

        function createReadsSet () {

        }

        function bindEvents () {
            $(container).find('input').change(function(event) {
                var id = event.currentTarget.id,
                    value = event.currentTarget.value;
                if (id === 'set-name') {
                    setName = value;
                }
                else if (id === 'set-desc') {
                    setDescription = value;
                }
                updateModel();
            });
        }

        function renderEditor () {
            var tmpl = Handlebars.compile(Template);
            container.innerHTML = tmpl();
            bindEvents();
        }

        function start(args) {
            container = args.node;
            model = args.model;
            return Promise.try(function() {
                renderEditor();
            });
        }

        function stop() {
            return Promise.try(function() {

            });
        }

        return {
            start: start,
            stop: stop
        }

    }

    return {
        make: factory
    }
});
