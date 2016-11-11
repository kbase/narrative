/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    'notebook/js/outputarea',
    'kb_common/html',
    'common/events',
    'common/utils',
    '../appCellController',
    'bootstrap'
], function (Promise, OutputArea, html, Events, utils, AppCellController) {
    'use strict';

    function factory(config) {
        var container,
            cell,
            t = html.tag,
            div = t('div'),
            span = t('span'),
            table = t('table'), tr = t('tr'), td = t('td'), th = t('th');

        // RENDERING

        function renderLayout() {
            var events = Events.make(),
                content = div({dataElement: 'output-widget-form', class: 'container-fluid'}, [
                    // Insert fields into here.
                    utils.buildPanel({
                        title: 'Run Status',
                        name: 'run-bar',
                        hidden: false,
                        type: 'default',
                        body: [
                            div({style: {lineHeight: '20px'}}, [
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
                    utils.buildPanel({
                        title: 'Job Details Status',
                        name: 'job-details',
                        hidden: false,
                        type: 'default',
                        body: [
                            table({class: 'table table-striped'}, [
                                tr([th('Job Id'), td({dataElement: 'id'})]),
                                tr([th('Status'), td({dataElement: 'status'})]),
                                tr([th('Deleted?'), td({dataElement: 'deleted'})]),
                                tr([th('Submitted'), td({dataElement: 'submitted'})]),
                                tr([th('Started'), td({dataElement: 'started'})]),
                                tr([th('Completed'), td({dataElement: 'completed'})])
                            ])
                        ]
                    })
                ]);
            return {
                content: content,
                events: events
            };
        }
        
         function renderJobDetails() {
             console.log('RENDERING job details')
            var details = utils.getMeta(cell, 'jobDetails');
            if (details) {
                Object.keys(details).forEach(function (key) {
                    var value = details[key],
                        el = utils.getElement(container, ['job-details', key]);
                    if (el) {
                        el.innerHTML = value;
                    }
                });
            }
        }

        // LIFECYCLE

        function init(config) {
            return Promise.try(function () {
                cell = AppCellController.getCell(config.kbaseCellId);
                return null;
            });
        }

        function attach(node) {
            return Promise.try(function () {
                container = node;
                var layout = renderLayout();
                container.innerHTML = layout.content;
                layout.events.attachEvents();
            });
        }

        function start() {
            return Promise.try(function () {
                // Listen for events
                renderJobDetails();
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