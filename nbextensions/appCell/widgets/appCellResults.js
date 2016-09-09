/*global define*/
/*jslint white:true,browser:true*/

define([
    'jquery',
    'bluebird',
    'kb_common/html',
    'common/runtime',
    'kbaseReportView'
], function (
    $,
    Promise,
    html,
    Runtime,
    KBaseReportView
) {
    'use strict';

    function factory(config) {
        var container,
            model,
            t = html.tag,
            div = t('div'),
            span = t('span'),
            a = t('a'),
            table = t('table'),
            tr = t('tr'),
            th = t('th'),
            td = t('td'),
            pre = t('pre'),
            input = t('input'),
            img = t('img'),
            p = t('p'),
            blockquote = t('blockquote');

        function buildPresentableJson(data) {
            return JSON.stringify(data);

            switch (typeof data) {
                case 'string':
                    return data;
                case 'number':
                    return String(data);
                case 'boolean':
                    return String(data);
                case 'object':
                    if (data === null) {
                        return 'NULL';
                    }
                    if (data instanceof Array) {
                        return table({class: 'table table-striped'},
                            data.map(function (datum, index) {
                                return tr([
                                    th(String(index)),
                                    td(buildPresentableJson(datum))
                                ]);
                            }).join('\n')
                            );
                    }
                    return table({class: 'table table-striped'},
                        Object.keys(data).map(function (key) {
                        return tr([th(key), td(buildPresentableJson(data[key]))]);
                    }).join('\n')
                        );
                default:
                    return 'Not representable: ' + (typeof data);
            }
        }

        function start(arg) {
            return Promise.try(function () {
                console.log('starting results widget!');
                container = arg.node;
                model = arg.model;

                // Very simple for now, just render the results json in a prettier than normal fashion.
                var result = model.getItem('exec.jobState.result');
                var result = model.getItem('exec.outputWidgetInfo');
                console.log('RESULT', result);

                var content;
                // If there's a "report_ref" key in the results, load and show the report.
                if (result.params.report_name) {
                    // do report widget.
                    container.innerHTML = '<div></div>';
                    new KBaseReportView($(container), result.params);
                }
                else {
                    container.innerHTML = buildPresentableJson(result);
                }
            });
        }

        function stop() {
            return Promise.try(function () {
                container.innerHTML = 'Bye from results';
            });
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});