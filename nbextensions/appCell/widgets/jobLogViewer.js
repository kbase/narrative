/*global define*/
/*jslint white:true,browser:true*/

define([
    'common/runtime',
    'common/props',
    'common/dom',
    'common/events',
    'common/fsm',
    'kb_common/html',
    'css!kbase/css/kbaseJobLog.css'
], function (
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
                        auto: false
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
        var runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus(null, 'Log Viewer Bus'),
            container,
            jobId,
            model,
            dom,
            loopFrequency = 5000,
            looping = false;

        // VIEW ACTIONS


        function scheduleNextRequest() {
            if (!looping) {
                return;
            }
            window.setTimeout(function () {
                runtime.bus().emit('request-latest-job-log', {
                    jobId: jobId,
                    num_lines: 10
                });
            }, loopFrequency);
        }

        function doStartFetchingLogs() {
            if (looping) {
                return;
            }
            looping = true;
            runtime.bus().emit('request-latest-job-log', {
                jobId: jobId,
                num_lines: 10
            });
//            dom.disableButton('play');
//            dom.enableButton('stop');
        }

        function doStopFetchingLogs() {
            looping = false;
//            dom.enableButton('play');
//            dom.disableButton('stop');
        }

        // VIEW

        function renderLayout() {
            var events = Events.make(),
                content = div({dataElement: 'kb-log'}, [
                    div({dataElement: 'header'}, [
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
                            title: 'Jump to the top'
                        }, [
                            span({class: 'fa fa-fast-backward'})
                        ]),
                        button({
                            class: 'btn btn-sm btn-default',
                            dataButton: 'back',
                            dataToggle: 'tooltip',
                            dataPlacement: 'top',
                            title: 'Fetch previous log chunk'
                        }, [
                            span({class: 'fa fa-backward'})
                        ]),
                        button({
                            class: 'btn btn-sm btn-default',
                            dataButton: 'forward',
                            dataToggle: 'tooltip',
                            dataPlacement: 'top',
                            title: 'Fetch next log chunk'
                        }, [
                            span({class: 'fa fa-forward'})
                        ]),
                        button({
                            class: 'btn btn-sm btn-default',
                            dataButton: 'bottom',
                            dataToggle: 'tooltip',
                            dataPlacement: 'top',
                            title: 'Jump to the end'
                        }, [
                            span({class: 'fa fa-fast-forward'})
                        ]),
                        div({dataElement: 'spinner', class: 'pull-right'}, [
                            span({class: 'fa fa-spinner fa-pulse fa-ex fa-fw'})
                        ])
                    ]),
                    div({dataElement: 'panel'}, [
                        pre(['Logging not started yet! Press the ', span({class: 'fa fa-play'}), ' button to start'])
                    ])
                ]);

            return {
                content: content,
                events: events
            };
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
                    pre(line.text)
                ])
            ]);
        }

        function renderLines(lines) {
            return lines.map(function (line) {
                return renderLine(line);
            }).join('\n');
        }

        function render() {
            var startingLine = model.getItem('firstLine'),
                lines = model.getItem('lines'),
                viewLines;

            if (lines) {
                viewLines = lines.map(function (line, index) {
                    return {
                        text: line.line,
                        isError: (line.is_error === 1 ? true : false),
                        lineNumber: startingLine + index + 1
                    };
                });
                dom.setContent('panel', renderLines(viewLines));
            }
        }

        function requestLatestLog() {
            dom.showElement('spinner');
            runtime.bus().emit('request-latest-job-log', {
                jobId: jobId,
                num_lines: 10
            });
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
                    model.setItem('lines', message.logs.lines);
                    model.setItem('firstLine', message.logs.first);
                    model.setItem('latest', true);
                    model.setItem('fetchedAt', new Date().toUTCString());
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
                    // if the job is finished, we don't want to reflect
                    // this in the ui, and disable play/stop controls.
                    var jobStatus = message.jobState.status,
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
                                    requestLatestLog();
                                    newState = {
                                        mode: 'complete'
                                    };
                                    break;
                                case 'error':
                                case 'suspend':
                                    requestLatestLog();
                                    newState = {
                                        mode: 'error'
                                    };
                                    break;
                                default: 
                                    console.error('Unknown jog status', jobStatus, message);
                                    throw new Error('Unknown jog status');
                            }
                            break;
                        case 'active':
                            switch (jobStatus) {
                                case 'queued':
                                case 'in-progress':
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
                                    throw new Error('Unknown jog status');
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
                    fsm.newState(newState);
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
                    alert('No job log :( -- it has been deleted');
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
        }
        
        function initializeFSM() {
            fsm = Fsm.make({
                states: appStates,
                initialState: {
                    mode: 'new'
                },
                onNewState: function (fsm) {
                    // save the state?
                    
                    renderFSM();
                }
            });
            fsm.start();
        }
        


        function start() {
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
        }

        function stop() {
            stopEventListeners();
            bus.stop();
        }

        // MAIN

        model = Props.make({
            data: {
                lines: [],
                firstLine: null,
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