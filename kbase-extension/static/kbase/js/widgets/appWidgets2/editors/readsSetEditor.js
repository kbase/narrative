/*eslint-env browser*/

define([
    'jquery',
    'bluebird',
    'handlebars',
    'text!kbase/templates/readsSetEditor/widgetTemplate.html',
], ($, Promise, Handlebars, Template) => {
    'use strict';

    function factory(config) {
        let container,
            parentBus = config.bus,
            cellBus = config.cellBus,
            model,
            setName = '',
            setDescription = '';

        function updateModel() {
            const stringInput = ['name:' + setName, 'desc:' + setDescription].join(', ');
            model.setItem('params.string_input', stringInput);
            cellBus.emit('editor-updated');
        }

        function createReadsObjectRow() {}

        function createReadsSet() {}

        function bindEvents() {
            $(container)
                .find('input')
                .change((event) => {
                    const id = event.currentTarget.id,
                        value = event.currentTarget.value;
                    if (id === 'set-name') {
                        setName = value;
                    } else if (id === 'set-desc') {
                        setDescription = value;
                    }
                    updateModel();
                });
        }

        function renderEditor() {
            const tmpl = Handlebars.compile(Template);
            container.innerHTML = tmpl();
            bindEvents();
        }

        function start(args) {
            container = args.node;
            model = args.model;
            return Promise.try(() => {
                renderEditor();
            });
        }

        function stop() {
            return Promise.try(() => {});
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: factory,
    };
});
