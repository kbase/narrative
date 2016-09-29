/*global define*/
/*jslint white:true,browser:true,nomen:true*/

define([
    'bluebird',
    'common/runtime',
    'common/ui',
    'common/format',
    'kb_common/html'
], function (Promise, Runtime, UI, format, html) {
    'use strict';
    
    var t = html.tag,
        div = t('div'), span = t('span');

    function updateRunStats(ui, jobState, lastUpdated) {
        if (!jobState) {
            return;
        }

        var viewModel = {
            lastUpdated: {
                elapsed: null,
                time: null
            },
            queue: {
                active: null,
                label: null,
                elapsed: null,
                position: null
            },
            run: {
                active: null,
                label: null,
                elapsed: null
            },
            finish: {
                active: null,
                state: null,
                when: null
            }
        },
        now = new Date().getTime();

        if (lastUpdated) {
            viewModel.lastUpdated.time = format.niceElapsedTime(lastUpdated);
            viewModel.lastUpdated.elapsed = format.elapsedTime(now - lastUpdated);
        }

        if (jobState.creation_time) {
            if (jobState.exec_start_time) {
                // Queue is finished.
                viewModel.queue.active = false;
                viewModel.queue.label = 'Queued for';
                viewModel.queue.elapsed = format.elapsedTime(jobState.exec_start_time - jobState.creation_time);

                if (jobState.finish_time) {
                    viewModel.run.active = false;
                    viewModel.run.label = 'Ran in';
                    viewModel.run.elapsed = format.elapsedTime(jobState.finish_time - jobState.exec_start_time);

                    viewModel.finish.active = true;
                    viewModel.finish.state = jobState.job_state;
                    viewModel.finish.when = format.niceElapsedTime(jobState.finish_time);

                } else {
                    viewModel.run.active = true;
                    viewModel.run.label = 'Running for';
                    viewModel.run.elapsed = format.elapsedTime(now - jobState.exec_start_time);
                }
            } else {
                viewModel.run.label = 'Run';

                viewModel.queue.active = true;
                viewModel.queue.label = 'In Queue';
                viewModel.queue.position = jobState.position;
                viewModel.queue.elapsed = format.elapsedTime(now - jobState.creation_time);
            }
        }

        ui.updateFromViewModel(viewModel);
    }

    function renderRunStats() {
        var labelStyle = {
            textAlign: 'right',
            border: '1px transparent solid',
            padding: '4px'
        },
        dataStyle = {
            border: '1px silver solid',
            padding: '4px',
            display: 'inline-block',
            minWidth: '20px',
            backgroundColor: 'gray',
            color: '#FFF'
        };
        return div({dataElement: 'run-stats', style: {paddingTop: '6px'}}, [
            div({class: 'row', dataElement: 'lastUpdated'}, [
                div({class: 'col-md-2', style: labelStyle}, span({dataElement: 'label'}, 'Last updated')),
                div({class: 'col-md-2', style: dataStyle}, span({dataElement: 'elapsed', class: 'kb-elapsed-time'})),
                div({class: 'col-md-2', style: dataStyle}, span({dataElement: 'time'}))
            ]),
            div({class: 'row', dataElement: 'queue'}, [
                div({class: 'col-md-2', style: labelStyle}, span({dataElement: 'label'}, 'Queue')),
                div({class: 'col-md-2', style: dataStyle}, span({dataElement: 'elapsed', class: 'kb-elapsed-time'})),
                div({class: 'col-md-2', style: labelStyle}, 'Position'),
                div({class: 'col-md-2', style: dataStyle}, span({dataElement: 'position'}))
            ]),
            div({class: 'row', dataElement: 'run'}, [
                div({class: 'col-md-2', style: labelStyle}, span({dataElement: 'label'}, 'Run')),
                div({class: 'col-md-2', style: dataStyle}, span({dataElement: 'elapsed', class: 'kb-elapsed-time'}))
            ]),
            div({class: 'row', dataElement: 'finish'}, [
                div({class: 'col-md-2', style: labelStyle}, 'Finish'),
                div({class: 'col-md-2', style: dataStyle}, span({dataElement: 'state'})),
                div({class: 'col-md-2', style: labelStyle}, 'When'),
                div({class: 'col-md-2', style: dataStyle}, span({dataElement: 'when'}))
            ])
        ]);
    }

    function factory(config) {
        var container, ui, listeners = [],
            model = config.model, runtime = Runtime.make();
        function start(arg) {
            return Promise.try(function () {
                container = arg.node;
                ui = UI.make({node: container});

                var jobState = model.getItem('exec.jobState');
                var lastUpdated = model.getItem('exec.jobStateUpdated');

                container.innerHTML = renderRunStats();

                updateRunStats(ui, jobState, lastUpdated);

                listeners.push(runtime.bus().on('clock-tick', function () {
                    updateRunStats(ui, model.getItem('exec.jobState'), model.getItem('exec.jobStateUpdated'));
                }));

            });
        }

        function stop() {
            return Promise.try(function () {
                runtime.bus().removeListeners(listeners);
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