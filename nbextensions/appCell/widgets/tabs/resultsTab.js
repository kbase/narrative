/*global define*/
/*jslint white:true,browser:true,nomen:true*/

define([
    'bluebird',
    'jquery',
    'common/ui',
    'kb_common/html',
    'kbaseReportView'
], function (Promise, $, UI,  html, KBaseReportView) {
    'use strict';
    var t = html.tag,
        div = t('div'), p = t('p');

    function factory(config) {
        var container, model = config.model, ui;
        function start(arg) {
            return Promise.try(function () {
                container = arg.node;
                model = arg.model;
                ui = UI.make({node: container});

                var result = model.getItem('exec.outputWidgetInfo');
                var jobState = model.getItem('exec.jobState');
                var finishDate = new Date(jobState.finish_time);

                var layout = div([
                    div({dataElement: 'summary'}),
                    div({dataElement: 'results'}),
                    div({dataElement: 'report'})
                ]);
                container.innerHTML = layout;
                    
                ui.setContent('summary', p([
                    'Results from run finished on ',
                    finishDate.toLocaleDateString() + ' at ', 
                    finishDate.toLocaleTimeString()
                ].join('')));
                 
                                      
                // If there's a "report_ref" key in the results, load and show the report.
                if (result.params.report_name) {
                    // do report widget.
                    new KBaseReportView($(ui.getElement('report')), result.params);                 
                } else {
                    ui.setContent('results', ui.buildPresentableJson(result));                    
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