/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    'common/runtime',
    'common/props',
    'common/dom',
    'common/events',
    'common/fsm',
    'kb_common/html',
    'css!kbase/css/kbaseJobLog.css'
], function (
    Promise,
    Runtime,
    Props,
    Dom,
    Events,
    Fsm,
    html
    ) {
    'use strict';

    var t = html.tag,
        div = t('div'), button = t('button'), span = t('span'), pre = t('pre'),
        fsm,
        appStates = [
            {
                state: {
                    mode: 'new'
                },
                meta: {
                    description: 'Widget just created, do not yet know the state of the job'
                },
                ui: {
                    buttons: {
                        enabled: [],
                        disabled: ['play', 'stop', 'top', 'back', 'forward', 'bottom']
                    }
                },
                next: [
                    {
                        mode: 'active',
                        auto: true
                    },
                    {
                        mode: 'complete'
                    },
                    {
                        mode: 'error'
                    }
                ]
            },
            {
                state: {
                    mode: 'active',
                    auto: true
                },
                meta: {
                    description: 'The Job is currently active, receiving log updates automatically'
                },
                ui: {
                    buttons: {
                        enabled: ['stop', 'top', 'back', 'forward', 'bottom'],
                        disabled: ['play']
                    }
                },
                next: [
                    {
                        mode: 'active',
                        auto: false
                    },
                    {
                        mode: 'active',
                        auto: true
                    },
                    {
                        mode: 'complete'
                    },
                    {
                        mode: 'error'
                    }
                ]
            },
            {
                state: {
                    mode: 'active',
                    auto: false
                },
                meta: {
                    description: 'The job is currently active, no automatic updates'
                },
                ui: {
                    buttons: {
                        enabled: ['play', 'top', 'back', 'forward', 'bottom'],
                        disabled: ['stop']
                    }
                },
                next: [
                    {
                        mode: 'active',
                        auto: true
                    },
                    {
                        mode: 'complete'
                    },
                    {
                        mode: 'error'
                    }
                ]
            },
            {
                state: {
                    mode: 'complete'
                },
                ui: {
                    buttons: {
                        enabled: ['top', 'back', 'forward', 'bottom'],
                        disabled: ['play', 'stop']
                    }
                }
            },
            {
                state: {
                    mode: 'error'
                },
                ui: {
                    buttons: {
                        enabled: ['top', 'back', 'forward', 'bottom'],
                        disabled: ['play', 'stop']
                    }
                }
            }
        ];
    function factory(config) {
        var config = config || {},
            runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus(null, 'Log Viewer Bus'),
            container,
            jobId,
            model,
            dom,
            linesPerPage = config.linesPerPage || 10,
            loopFrequency = 5000,
            looping = false;

        // VIEW ACTIONS


        function scheduleNextRequest() {
            if (!looping) {
                return;
            }
            window.setTimeout(function () {
                if (!looping) {
                    return;
                }
                requestLatestJobLog();
            }, loopFrequency);
        }

        function stopAutoFetch() {
            var state = fsm.getCurrentState().state;
            if (state.mode === 'active' && state.auto) {
                looping = false;
                fsm.newState({mode: 'active', auto: false});
            }
        }

        function startAutoFetch() {
            var state = fsm.getCurrentState().state;
            if (state.mode === 'new' || (state.mode === 'active' && !state.auto)) {
                looping = true;
                fsm.newState({mode: 'active', auto: true});
                runtime.bus().emit('request-latest-job-log', {
                    jobId: jobId,
                    options: {
                        num_lines: linesPerPage
                    }
                });
            }
        }


        function doStartFetchingLogs() {
            startAutoFetch();
        }

        function doStopFetchingLogs() {
            stopAutoFetch();
        }

        function requestJobLog(firstLine) {
            dom.showElement('spinner');
            runtime.bus().emit('request-job-log', {
                jobId: jobId,
                options: {
                    first_line: firstLine,
                    num_lines: linesPerPage
                }
            });
        }

        function requestLatestJobLog() {
            dom.showElement('spinner');
            runtime.bus().emit('request-latest-job-log', {
                jobId: jobId,
                options: {
                    num_lines: linesPerPage
                }
            });
        }

        function doFetchFirstLogChunk() {
            var currentLine = model.getItem('currentLine');

            if (currentLine === 0) {
                return;
            }

            stopAutoFetch();

            requestJobLog(0);
        }

        function doFetchPreviousLogChunk() {
            var currentLine = model.getItem('currentLine'),
                newFirstLine = currentLine - linesPerPage;

            stopAutoFetch();

            if (currentLine === 0) {
                return;
            }

            if (newFirstLine < 0) {
                newFirstLine = 0;
            }

            requestJobLog(newFirstLine);
        }
        function doFetchNextLogChunk() {
            var currentLine = model.getItem('currentLine'),
                lastLine = model.getItem('lastLine'),
                newFirstLine;

            stopAutoFetch();

            // Get the current set of log lines again, since we don't have 
            // a full page. 
            // TODO: don't do this if the job state is completed
            if ((lastLine - currentLine) < linesPerPage) {
                newFirstLine = currentLine;
            } else {
                // NB this is actually the next line after the end
                newFirstLine = currentLine + linesPerPage;
            }

            requestJobLog(newFirstLine);
        }

        function doFetchLastLogChunk() {
            var firstLine,
                lastLine = model.getItem('lastLine');

            stopAutoFetch();

            if (!lastLine) {
                requestLatestJobLog();
            } else {
                firstLine = lastLine - (lastLine % linesPerPage);

                requestJobLog(firstLine);
            }
        }

        // VIEW

        function renderControls(events) {
            return div({dataElement: 'header', style: {margin: '0 0 10px 0'}}, [
                button({
                    class: 'btn btn-sm btn-default',
                    dataButton: 'play',
                    dataToggle: 'tooltip',
                    dataPlacement: 'top',
                    title: 'Start fetching logs',
                    id: events.addEvent({
                        type: 'click',
                        handler: doStartFetchingLogs
                    })
                }, [
                    span({class: 'fa fa-play'})
                ]),
                button({
                    class: 'btn btn-sm btn-default',
                    dataButton: 'stop',
                    dataToggle: 'tooltip',
                    dataPlacement: 'top',
                    title: 'Stop fetching logs',
                    id: events.addEvent({
                        type: 'click',
                        handler: doStopFetchingLogs
                    })
                }, [
                    span({class: 'fa fa-stop'})
                ]),
                button({
                    class: 'btn btn-sm btn-default',
                    dataButton: 'top',
                    dataToggle: 'tooltip',
                    dataPlacement: 'top',
                    title: 'Jump to the top',
                    id: events.addEvent({
                        type: 'click',
                        handler: doFetchFirstLogChunk
                    })
                }, [
                    span({class: 'fa fa-fast-backward'})
                ]),
                button({
                    class: 'btn btn-sm btn-default',
                    dataButton: 'back',
                    dataToggle: 'tooltip',
                    dataPlacement: 'top',
                    title: 'Fetch previous log chunk',
                    id: events.addEvent({
                        type: 'click',
                        handler: doFetchPreviousLogChunk
                    })
                }, [
                    span({class: 'fa fa-backward'})
                ]),
                button({
                    class: 'btn btn-sm btn-default',
                    dataButton: 'forward',
                    dataToggle: 'tooltip',
                    dataPlacement: 'top',
                    title: 'Fetch next log chunk',
                    id: events.addEvent({
                        type: 'click',
                        handler: doFetchNextLogChunk
                    })
                }, [
                    span({class: 'fa fa-forward'})
                ]),
                button({
                    class: 'btn btn-sm btn-default',
                    dataButton: 'bottom',
                    dataToggle: 'tooltip',
                    dataPlacement: 'top',
                    title: 'Jump to the end',
                    id: events.addEvent({
                        type: 'click',
                        handler: doFetchLastLogChunk
                    })

                }, [
                    span({class: 'fa fa-fast-forward'})
                ]),
                // div({dataElement: 'fsm-debug'}),
                div({dataElement: 'spinner', class: 'pull-right'}, [
                    span({class: 'fa fa-spinner fa-pulse fa-ex fa-fw'})
                ])
            ]);
        }

        function renderLayout() {
            var events = Events.make(),
                content = div({dataElement: 'kb-log', style: {marginTop: '10px'}}, [
                    div({class: 'kblog-line'}, [
                        div({class: 'kblog-num-wrapper'}, [
                            div({class: 'kblog-line-num'}, [
                            ])
                        ]),
                        div({class: 'kblog-text'}, [
                            renderControls(events)
                        ])
                    ]),
                    div({dataElement: 'panel'}, [
                        pre(['Log viewer initialized, awaiting most recent log messages...'])
                    ])
                ]);

            return {
                content: content,
                events: events
            };
        }
        
        function sanitize(text) {
            return text;
        }

        function renderLine(line) {
            var extraClass = line.isError ? ' kb-error' : '';

            return div({class: 'kblog-line' + extraClass}, [
                div({class: 'kblog-num-wrapper'}, [
                    div({class: 'kblog-line-num'}, [
                        String(line.lineNumber)
                    ])
                ]),
                div({class: 'kblog-text'}, [
                    div({style: {marginBottom: '6px'}}, sanitize(line.text))
                ])
            ]);
        }

        function renderLines(lines) {
            return lines.map(function (line) {
                return renderLine(line);
            }).join('\n');
        }

        function render() {
            var startingLine = model.getItem('currentLine'),
                lines = model.getItem('lines'),
                viewLines;

            if (lines) {
                if (lines.length === 0) {
                    dom.setContent('panel', 'Sorry, no log entries to show');
                    return;
                }
                viewLines = lines.map(function (line, index) {
                    return {
                        text: line.line,
                        isError: (line.is_error === 1 ? true : false),
                        lineNumber: startingLine + index + 1
                    };
                });
                dom.setContent('panel', renderLines(viewLines));
            } else {
                dom.setContent('panel', 'Sorry, no log yet...');
            }
        }

        var externalEventListeners = [];
        function startEventListeners() {
            var ev;

            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-logs'
                },
                handle: function (message) {
                    dom.hideElement('spinner');
                    
                    if (message.logs.lines.length === 0) {
                        // TODO: add an alert area and show a dismissable alert.
                        if (!looping) {
                            // alert('No log entries returned');
                            console.warn('No log entries returned', message);
                        }
                    } else {                    
                        model.setItem('lines', message.logs.lines);
                        model.setItem('currentLine', message.logs.first);
                        model.setItem('latest', true);
                        model.setItem('fetchedAt', new Date().toUTCString());
                        // Detect end of log.
                        var lastLine = model.getItem('lastLine'),
                            batchLastLine = message.logs.first + message.logs.lines.length;
                        if (!lastLine) {
                            lastLine = batchLastLine;
                        } else {
                            if (batchLastLine > lastLine) {
                                lastLine = batchLastLine;
                            }
                        }
                        model.setItem('lastLine', lastLine);
                    }
                    if (looping) {
                        scheduleNextRequest();
                    }
                }
            });
            externalEventListeners.push(ev);

            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-status'
                },
                handle: function (message) {
                    // console.log('LOGS job-status', message)
                    // if the job is finished, we don't want to reflect
                    // this in the ui, and disable play/stop controls.
                    var jobStatus = message.jobState.job_state,
                        mode = fsm.getCurrentState().state.mode,
                        newState;
                    switch (mode) {
                        case 'new':
                            switch (jobStatus) {
                                case 'queued':
                                case 'in-progress':
                                    doStartFetchingLogs();
                                    newState = {
                                        mode: 'active',
                                        auto: true
                                    };
                                    break;
                                case 'completed':
                                    requestLatestJobLog();
                                    newState = {
                                        mode: 'complete'
                                    };
                                    break;
                                case 'error':
                                case 'suspend':
                                    requestLatestJobLog();
                                    newState = {
                                        mode: 'error'
                                    };
                                    break;
                                default:
                                    console.error('Unknown job status', jobStatus, message);
                                    throw new Error('Unknown job status ' + jobStatus);
                            }
                            break;
                        case 'active':
                            switch (jobStatus) {
                                case 'queued':
                                case 'in-progress':
                                    break;
                                case 'completed':
                                    newState = {
                                        mode: 'complete'
                                    };
                                    break;
                                case 'error':
                                case 'suspend':
                                    newState = {
                                        mode: 'error'
                                    };
                                    break;
                                default:
                                    console.error('Unknown jog status', jobStatus, message);
                                    throw new Error('Unknown jog status ' + jobStatus);
                            }
                            break;
                        case 'complete':
                            switch (jobStatus) {
                                case 'completed':
                                    return;
                                default:
                                    // technically, an error, what to do?
                                    return;
                            }
                        case 'error':
                            switch (jobStatus) {
                                case 'error':
                                case 'suspend':
                                    // nothing to do;
                                    return;
                                default:
                                    // technically, an error, what to do?
                                    return;
                            }
                        default:
                            throw new Error('Mode ' + mode + ' not yet implemented');
                    }
                    if (newState) {
                        fsm.newState(newState);
                    }
                }
            });
            externalEventListeners.push(ev);


            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-log-deleted'
                },
                handle: function (message) {
                    stopAutoFetch();
                    console.warn('No job log :( -- it has been deleted');
                }
            });
            externalEventListeners.push(ev);

        }
        function stopEventListeners() {
            externalEventListeners.forEach(function (ev) {
                runtime.bus().removeListener(ev);
            });
        }

        // LIFECYCLE API

        function renderFSM() {
            //showFsmBar();
            var state = fsm.getCurrentState();

            // Button state
            if (state.ui.buttons) {
                state.ui.buttons.enabled.forEach(function (button) {
                    dom.enableButton(button);
                });
                state.ui.buttons.disabled.forEach(function (button) {
                    dom.disableButton(button);
                });
            }


            // Element state
            if (state.ui.elements) {
                state.ui.elements.show.forEach(function (element) {
                    dom.showElement(element);
                });
                state.ui.elements.hide.forEach(function (element) {
                    dom.hideElement(element);
                });
            }

            // Emit messages for this state.
            if (state.ui.messages) {
                state.ui.messages.forEach(function (message) {
                    bus.send(message.message, message.address);
                    // widgets[message.widget].bus.send(message.message, message.address);
                });
            }

            // dom.setContent('fsm-debug', JSON.stringify(state.state) + ',' + jobId);

        }

        function initializeFSM() {
            fsm = Fsm.make({
                states: appStates,
                initialState: {
                    mode: 'new'
                },
                onNewState: function (fsm) {
                    // save the state?

                    renderFSM(fsm);
                }
            });
            fsm.start();
        }

        function start() {
            return Promise.try(function () {
                bus.on('run', function (message) {
                    var root = message.node;
                    container = root.appendChild(document.createElement('div'));
                    dom = Dom.make({node: container});
                    
                    jobId = message.jobId;

                    var layout = renderLayout();
                    container.innerHTML = layout.content;
                    layout.events.attachEvents(container);

                    initializeFSM();
                    renderFSM();

                    // dom.disableButton('stop');

                    // We need to initially listen purely for the presence of a
                    // job id. We cannot assume we have it when we start, and 
                    // we also must be prepared for it to be deleted.
                    // OR should the lifetime of this widget just be assumed to
                    // intersect with the lifetime of the job?
                    startEventListeners();

                    runtime.bus().emit('request-job-status', {
                        jobId: jobId
                    });


                    // always start with the latest log entries, if any.
                    // requestLatestLog();
                });
            });
        }

        function stop() {
            stopEventListeners();
            bus.stop();
        }

        // MAIN

        model = Props.make({
            data: {
                cache: [],
                lines: [],
                currentLine: null,
                lastLine: null,
                linesPerPage: 10,
                fetchedAt: null
            },
            onUpdate: function () {
                render();
            }
        });

        // API

        return Object.freeze({
            start: start,
            stop: stop,
            bus: bus
        });
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});