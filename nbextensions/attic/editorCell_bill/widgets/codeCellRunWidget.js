/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    'notebook/js/outputarea',
    'kb_common/html',
    'common/events',
    'common/utils',
    '../appCellController'
], function (Promise, OutputArea, html, Events, utils, AppCellController) {
    'use strict';

    function factory(config) {
        var container,
            t = html.tag,
            div = t('div'),
            form = t('form');

        // RENDERING

        function renderLayout() {
            var events = Events.make(),
                content = div({class: 'kbase-extension kb-app-cell', style: {display: 'flex', alignItems: 'stretch'}}, [
                    div({class: 'prompt', dataElement: 'prompt', style: {display: 'flex', alignItems: 'stretch', width: '14ex', flexDirection: 'column'}}, [
                        div({dataElement: 'status'})
                    ]),
                    div({class: 'body', dataElement: 'body', style: {display: 'flex', alignItems: 'stretch', flexDirection: 'column', flex: '1'}}, [
                        div({dataElement: 'notifications', style: {display: 'block', width: '100%'}}),
                        div({dataElement: 'widget', style: {display: 'block', width: '100%'}}, [
                            form({dataElement: 'input-widget-form'}, div({class: 'container-fluid'}, [
                                // Insert fields into here.


                                utils.buildPanel({
                                    title: 'Run Status',
                                    name: 'run-bar',
                                    hidden: false,
                                    type: 'default',
                                    body: [
                                        div({style: {lineHeight: '20px'}}, [
                                            span({}, [
                                                button({class: 'btn btn-primary'}, 'Run')
                                            ]),
                                            span({
                                            }, [
                                                span('Launch:'),
                                                span({
                                                    style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                    dataElement: 'launch-time'
                                                })
                                            ]),
                                            span({
                                            }, [
                                                span('Queue:'),
                                                span({
                                                    style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                    dataElement: 'queue-time'
                                                })
                                            ]),
                                            span({
                                            }, [
                                                span('Running:'),
                                                span({
                                                    style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                    dataElement: 'running-time'
                                                })
                                            ]),
                                            span({
                                            }, [
                                                span('Sucess:'),
                                                span({
                                                    style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                    dataElement: 'success-time'
                                                })
                                            ]),
                                            span({
                                            }, [
                                                span('Error:'),
                                                span({
                                                    style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                    dataElement: 'error-time'
                                                })
                                            ])
                                        ])
                                    ]
                                }),
                            ]))
                        ])
                    ])
                ]);
            return {
                content: content,
                events: events
            };
        }


        function hook(args) {
            // find cell
            return new Promise(function (resolve, reject) {
                try {
                    console.log('ARGS', args, AppCellController);
                    var cell = AppCellController.getCell(args.kbaseCellId),
                        outputArea = cell.cell.output_area,
                        content = div({dataElement: 'widget'}),
                        toAppend = {
                            data: {
                                'text/html': content
                            }
                        };
                    outputArea.append_display_data(toAppend, function (node) {
                        resolve(node.find('[data-element="widget"]'));
                    });
                } catch (ex) {
                    reject(ex);
                }
            });
        }

        // LIFECYCLE

        function init(config) {
            return Promise.try(function () {
                return null;
            });
        }

        function attach(args) {
            return hook(args)
                .then(function (node) {
                    container = node.get(0);
                    container.innerHTML = "Hey, it worked!";
                    //                container = node;
                    //                var layout = renderLayout();
                    //                container.innerHTML = layout.content;
                    //                layout.events.attachEvents();
                });
        }

        function start() {
            return Promise.try(function () {
                // Listen for events
            });

        }

        function run(params) {
            return Promise.try(function () {
                return null;
            });

        }



        return {
            init: init,
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