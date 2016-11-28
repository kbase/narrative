/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb_common/html'
], function (html) {
    'use strict';
    var t = html.tag,
        div = t('div'), span = t('span');
    function factory(config) {
        var container,
            spec = config.spec,
            wrappedWidget = config.widget,
            wrappedId = html.genId();
        function xlayout() {
            return  [
                div({class: 'row'}, [
                    div({class: 'col-md-3'}, [
                        spec.name(),
                        '<br>',
                        span({style: {fontSize: '80%'}}, spec.label())
                    ]),
                    div({class: 'col-md-1'}, (spec.required() ? '*' : '-')),
                    div({class: 'col-md-2'}, spec.fieldType),
                    div({class: 'col-md-2'}, spec.dataType()),
                    div({class: 'col-md-4', id: wrappedId})
                ]),
                div({class: 'row'}, [
                    div({class: 'col-md-3'}),
                    div({class: 'col-md-2'}, (spec.multipleItems() ? 'mult' : 'single')),
                    div({class: 'col-md-2'}, spec.uiClass()),
                    div({class: 'col-md-5'})
                ]),
                div({class: 'row'}, [
                    div({class: 'col-md-2'}),
                    div({class: 'col-md-10'}, spec.hint())
                ]),
                div({class: 'row', style: {borderBottom: '1px silver solid'}}, [
                    div({class: 'col-md-2'}),
                    div({class: 'col-md-10'}, spec.description())
                ]),
                div({class: 'row', style: {borderBottom: '1px silver solid'}}, [
                    div({class: 'col-md-2'}),
                    div({class: 'col-md-10'}, spec.info())
                ])
            ].join('\n');
        }
        
        function xxlayout() {
            return  [
                div({class: 'row'}, [
                    div({class: 'col-md-3'}, [
                        spec.name(),
                        '<br>',
                        span({style: {fontSize: '80%'}}, spec.label())
                    ]),
                    div({class: 'col-md-9', id: wrappedId})
                ])
            ].join('\n');
        }
        
        function layout() {
            return div({id: wrappedId});
        }

        function attach(node) {
            container = node;
            container.innerHTML = layout();
            // convert our root node to a container for hosting the rows.
            // TODO: double check this.
            container.classList.add('container-fluid');
            return wrappedWidget.attach(container.querySelector('#' + wrappedId));
        }
        function start() {
            if (wrappedWidget.start) {
                return wrappedWidget.start();
            }
        }
        function run(input) {
            if (wrappedWidget.run) {
                return wrappedWidget.run(input);
            }
        }
        return {
            attach: attach,
            start: start,
            run: run
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});