/*global define*/
/*jslint white:true,browser:true*/
/**
 * Usage:
 * let viewer = JobLogViewer.make();
 * viewer.start({
 *     jobId: <some job id>,
 *     node: <a DOM node>
 * })
 */
define([
    'bluebird',
    'common/runtime',
    'common/props',
    'common/ui',
    'common/events',
    'common/fsm',
    'kb_common/html',
    'css!kbase/css/kbaseJobLog.css'
], function(
    Promise,
    Runtime,
    Props,
    UI,
    Events,
    Fsm,
    html
) {
    'use strict';

    let t = html.tag,
        div = t('div'),
        button = t('button'),
        span = t('span'),
        p = t('p'),
        fsm,
        currentSection,
        smallPanelHeight = '300px',
        largePanelHeight = '600px',
        numLines = 10,
        panel,
        panelHeight = smallPanelHeight,
        appStates = [{
            state: {
                mode: 'new'
            },
            meta: {
                description: 'Widget just created, do not yet know the state of the job'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['play', 'stop', 'top', 'bottom']
                }
            },
            next: [{
                mode: 'queued',
                auto: true
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
            },
            {
                mode: 'canceled'
            },
            {
                mode: 'job-not-found'
            }
            ]
        },
        {
            state: {
                mode: 'queued',
                auto: true
            },
            meta: {
                description: 'The job is queued, there are no logs yet.'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['play', 'stop', 'top', 'bottom']
                }
            },
            next: [{
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
                mode: 'canceled'
            },
            {
                mode: 'error'
            }
            ],
            on: {
                enter: {
                    messages: [{
                        emit: 'on-queued'
                    }]
                },
                resume: {
                    messages: [{
                        emit: 'on-queued'
                    }]
                },
                exit: {
                    messages: [{
                        emit: 'exit-queued'
                    }]
                }
            }
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
                    enabled: ['stop'],
                    disabled: ['play', 'top', 'bottom']
                }
            },
            next: [{
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
                mode: 'canceled'
            },
            {
                mode: 'error'
            }
            ],
            on: {
                enter: {
                    messages: [{
                        emit: 'on-active'
                    }]
                },
                resume: {
                    messages: [{
                        emit: 'on-active'
                    }]
                },
                exit: {
                    messages: [{
                        emit: 'exit-active'
                    }]
                }
            }
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
                    enabled: ['play', 'top', 'bottom'],
                    disabled: ['stop']
                }
            },
            next: [{
                mode: 'active',
                auto: true
            },
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
            ],
            on: {
                enter: {
                    messages: [{
                        emit: 'on-active-noauto'
                    }]
                },
                resume: {
                    messages: [{
                        emit: 'on-active-noauto'
                    }]
                },
                exit: {
                    messages: [{
                        emit: 'exit-active-noauto'
                    }]
                }
            }
        },
        {
            state: {
                mode: 'complete'
            },
            ui: {
                buttons: {
                    enabled: ['top', 'bottom'],
                    disabled: ['play', 'stop']
                }
            },
            on: {
                enter: {
                    messages: [{
                        emit: 'on-complete'
                    }]
                },
                resume: {
                    messages: [{
                        emit: 'on-complete'
                    }]
                },
                exit: {
                    messages: [{
                        emit: 'exit-complete'
                    }]
                }
            }
        },
        {
            state: {
                mode: 'canceled'
            },
            ui: {
                buttons: {
                    enabled: ['top', 'bottom'],
                    disabled: ['play', 'stop']
                }
            },
            on: {
                enter: {
                    messages: [{
                        emit: 'on-canceled'
                    }]
                },
                resume: {
                    messages: [{
                        emit: 'on-canceled'
                    }]
                },
                exit: {
                    messages: [{
                        emit: 'exit-canceled'
                    }]
                }
            }
        },
        {
            state: {
                mode: 'error'
            },
            ui: {
                buttons: {
                    enabled: ['top', 'bottom'],
                    disabled: ['play', 'stop']
                }
            },
            on: {
                enter: {
                    messages: [{
                        emit: 'on-error'
                    }]
                },
                resume: {
                    messages: [{
                        emit: 'on-error'
                    }]
                },
                exit: {
                    messages: [{
                        emit: 'exit-error'
                    }]
                }
            }
        },
        {
            state: {
                mode: 'job-not-found'
            },
            meta: {
                description: 'Job status returns a job not found error'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['play', 'stop', 'top', 'bottom']
                }
            },
            on: {
                enter: {
                    messages: [{
                        emit: 'on-job-not-found'
                    }]
                },
                resume: {
                    messages: [{
                        emit: 'on-job-not-found'
                    }]
                }
            },
            next: [{
                mode: 'job-not-found'
            }]
        }
        ];

    /**
     * The entrypoint to this widget. This creates the job log viewer and initializes it.
     * Starting it is left as a lifecycle method for the calling object.
     *
     */
    function factory() {
        let runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus({ description: 'Log Viewer Bus' }),
            container,
            jobId,
            panelId,
            model,
            ui,
            startingLine = 0,
            linesPerPage = null,
            loopFrequency = 5000,
            looping = false,
            stopped = false,
            listeningForJob = false,
            requestLoop = null;

        // VIEW ACTIONS

        function scheduleNextRequest() {
            if (!looping) {
                return;
            }
            requestLoop = window.setTimeout(function() {
                if (!looping) {
                    return;
                }
                requestLatestJobLog();
            }, loopFrequency);
        }

        function stopAutoFetch() {
            looping = false;
        }

        function startAutoFetch() {
            if (looping) {
                return;
            }
            if (stopped) {
                return;
            }
            var state = fsm.getCurrentState().state;
            if (state.mode === 'active' && state.auto) {
                looping = true;
                fsm.newState({ mode: 'active', auto: true });
                runtime.bus().emit('request-latest-job-log', {
                    jobId: jobId,
                    options: {
                        num_lines: linesPerPage
                    }
                });
            }
        }

        function doPlayLogs() {
            fsm.updateState({
                auto: true
            });
            stopped = false;
            startAutoFetch();
        }

        function doStopPlayLogs() {
            fsm.updateState({
                auto: false
            });
            stopped = true;
            stopAutoFetch();
        }

        function requestJobLog(firstLine, numLines, params) {
            ui.showElement('spinner');
            runtime.bus().emit('request-job-log', {
                jobId: jobId,
                options: {
                    first_line: firstLine,
                    num_lines: linesPerPage
                }
            });
        }

        function requestLatestJobLog() {
            // only while job is running
            // load numLines at a time
            // otherwise load entire log
            let autoState = fsm.getCurrentState().state.auto;
            if(autoState){
                linesPerPage = numLines; // set it to 10
            }
            ui.showElement('spinner');
            runtime.bus().emit('request-latest-job-log', {
                jobId: jobId,
                options: {
                    num_lines: linesPerPage
                }
            });
        }

        /**
         * Scroll to the top of the job log
         */
        function doFetchFirstLogChunk() {
            doStopPlayLogs();
            panel.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
              })
        }

        /**
         * scroll to the bottom of the job log
         */
        function doFetchLastLogChunk() {
            doStopPlayLogs();
            const lastChildElement = panel.lastChild
            lastChildElement.scrollIntoView({
                alignToTop: false,
                behavior: 'smooth',
                block: 'center'
            })
        }

        function toggleViewerSize() {
            panelHeight = panelHeight === smallPanelHeight ? largePanelHeight : smallPanelHeight;
            getPanelNode().style.height = panelHeight;
        }

        // VIEW
        /**
         * builds contents of panel-heading div
         * @param {??} events
         */
        function renderControls(events) {
            return div({ dataElement: 'header', style: { margin: '0 0 10px 0' } }, [
                button({
                    class: 'btn btn-sm btn-default',
                    dataButton: 'expand',
                    dataToggle: 'tooltip',
                    dataPlacement: 'top',
                    title: 'Toggle log viewer size',
                    id: events.addEvent({
                        type: 'click',
                        handler: toggleViewerSize
                    })
                }, [
                    span({ class: 'fa fa-expand' })
                ]),
                button({
                    class: 'btn btn-sm btn-default',
                    dataButton: 'play',
                    dataToggle: 'tooltip',
                    dataPlacement: 'top',
                    title: 'Start fetching logs',
                    id: events.addEvent({
                        type: 'click',
                        handler: doPlayLogs
                    })
                }, [
                    span({ class: 'fa fa-play' })
                ]),
                button({
                    class: 'btn btn-sm btn-default',
                    dataButton: 'stop',
                    dataToggle: 'tooltip',
                    dataPlacement: 'top',
                    title: 'Stop fetching logs',
                    id: events.addEvent({
                        type: 'click',
                        handler: doStopPlayLogs
                    })
                }, [
                    span({ class: 'fa fa-stop' })
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
                    span({ class: 'fa fa-angle-double-up' })
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
                    span({ class: 'fa fa-angle-double-down' })
                ]),
                div({ dataElement: 'spinner', class: 'pull-right hidden' }, [
                    span({ class: 'fa fa-spinner fa-pulse fa-ex fa-fw' })
                ])
            ]);
        }

        /**
         * builds contents of panel-body class
         * @param {string} panelId
         */
        function renderLayout(panelId) {
            const events = Events.make(),
                content = div({ dataElement: 'kb-log', style: { marginTop: '10px'}}, [
                    div({ class: 'kblog-header' }, [
                        div({ class: 'kblog-num-wrapper' }, [
                            div({ class: 'kblog-line-num' }, [])
                        ]),
                        div({ class: 'kblog-text' }, [
                            renderControls(events) // header
                        ])
                    ]),
                    div({ dataElement: 'panel', id: panelId,
                        style: {
                            'overflow-y': 'scroll',
                            height: panelHeight,
                            transition: 'height 0.5s'
                        }
                    })
                ]);

            return {
                content: content,
                events: events
            };
        }

        function sanitize(text) {
            var longWord = 80;
            var encoded = ui.htmlEncode(text);

            // try to make sane word length not break things.
            var words = encoded.split(/ /);

            var fixed = words.map(function(word) {
                if (word.length < longWord) {
                    return word;
                }
                return word.replace(/\//, '/<wbr>')
                    .replace(/\./, '.<wbr>');
            });

            return fixed.join(' ');
        }

        /**
         * build and return div that displays
         * individual job log line
         * <div class="kblog-line">
         *     <div class="kblog-num-wrapper">
         *        <span class="kblog-line-num">###</span>
         *        <span class="kblog-text">foobarbaz</span>
         *     </div>
         * </div>
         * @param {object} line
         */
        function buildLine(line) {
            // kblog-line wrapper div
            const errorClass = line.isError ? ' kb-error' : '';
            const kblogLine = document.createElement('div')
            kblogLine.setAttribute('class', 'kblog-line' + errorClass);
            // kblog-num-wrapper div
            const wrapperDiv = document.createElement('div');
            wrapperDiv.setAttribute('class', 'kblog-num-wrapper');
            // number
            const numDiv = document.createElement('div');
            numDiv.setAttribute('class', 'kblog-line-num');
            const lineNumber = document.createTextNode(line.lineNumber);
            numDiv.appendChild(lineNumber);
            // text
            const textDiv = document.createElement('div');
            textDiv.setAttribute('class', 'kblog-text');
            const lineText = document.createTextNode(line.text)
            textDiv.appendChild(lineText);
            // append line number and text
            wrapperDiv.appendChild(numDiv);
            wrapperDiv.appendChild(textDiv);
            // append wrapper to line div
            kblogLine.appendChild(wrapperDiv);

            return kblogLine;
        }

        /**
         * Append div that displays job log lines
         * to the panel
         * @param {array} lines
         */
        function makeLogChunkDiv(lines) {
            for (let i=0; i<lines.length; i+= 1){
                panel.appendChild(buildLine(lines[i]))
            }
        }

        /**
         * onUpdate callback function (under model)
         */
        function render() {
            const lines = model.getItem('lines');

            if (lines) {
                if (lines.length === 0) {
                    ui.setContent('panel', 'Sorry, no log entries to show');
                    return;
                }

                // new array of log texts
                // this should be a separate function(?)
                const viewLines = lines.map(function(line, index) {
                    startingLine += 1;
                    const text = sanitize(line.line)
                    return {
                        text: text,
                        isError: (line.is_error === 1 ? true : false),
                        lineNumber: startingLine
                    };
                });

                makeLogChunkDiv(viewLines);
                if (fsm.getCurrentState().state.auto) {
                    panel.lastElementChild.scrollIntoView({
                        alignToTop: false,
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            } else {
                ui.setContent('panel', 'Sorry, no log yet...');
            }
        }

        function handleJobStatusUpdate(message) {
            // if the job is finished, we don't want to reflect
            // this in the ui, and disable play/stop controls.
            var jobStatus = message.jobState.job_state,
                mode = fsm.getCurrentState().state.mode,
                newState;
            switch (mode) {
            case 'new':
                switch (jobStatus) {
                case 'queued':
                    startJobUpdates();
                    newState = {
                        mode: 'queued',
                        auto: true
                    };
                    break;
                case 'in-progress':
                    startJobUpdates();
                    startAutoFetch();
                    newState = {
                        mode: 'active',
                        auto: true
                    };
                    break;
                case 'completed':
                    requestLatestJobLog();
                    stopJobUpdates();
                    newState = {
                        mode: 'complete'
                    };
                    break;
                case 'error':
                case 'suspend':
                    requestLatestJobLog();
                    stopJobUpdates();
                    newState = {
                        mode: 'error'
                    };
                    break;
                case 'canceled':
                    requestLatestJobLog();
                    stopJobUpdates();
                    newState = {
                        mode: 'canceled'
                    };
                    break;
                default:
                    stopJobUpdates();
                    console.error('Unknown job status', jobStatus, message);
                    throw new Error('Unknown job status ' + jobStatus);
                }
                break;
            case 'queued':
                switch (jobStatus) {
                case 'queued':
                    // no change
                    break;
                case 'in-progress':
                    newState = {
                        mode: 'active',
                        auto: true
                    };
                    break;
                    // may happen that the job state jumps over in-progress...
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
                case 'canceled':
                    newState = {
                        mode: 'canceled'
                    };
                    break;
                default:
                    console.error('Unknown log status', jobStatus, message);
                    throw new Error('Unknown log status ' + jobStatus);
                }
                break;
            case 'active':
                switch (jobStatus) {
                case 'queued':
                    // this should not occur!
                    break;
                case 'in-progress':
                    startAutoFetch();
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
                case 'canceled':
                    newState = {
                        mode: 'canceled'
                    };
                    break;
                default:
                    console.error('Unknown log status', jobStatus, message);
                    throw new Error('Unknown log status ' + jobStatus);
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
            case 'canceled':
                switch (jobStatus) {
                case 'canceled':
                    return;
                default:
                    console.error('Unexpected log status ' + jobStatus + ' for "canceled" state');
                    throw new Error('Unexpected log status ' + jobStatus + ' for "canceled" state');
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

        function handleJobDoesNotExistUpdate(message) {
            fsm.newState({ mode: 'job-not-found' });
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
                handle: function(message) {
                    ui.hideElement('spinner');

                    if (message.logs.lines.length === 0) {
                        // TODO: add an alert area and show a dismissable alert.
                        if (!looping) {
                            // alert('No log entries returned');
                            console.warn('No log entries returned', message);
                        }
                    } else {
                        var lines = model.getItem('lines');
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

            // An error may encountered during the job fetch on the back end. It is
            // reported as a job-comm-error, but translated by the jobs panel as a job-log-deleted
            // TODO: we may want to rethink this. It might be beneficial to emit this as the
            // original error, and let the widget sort it out? Or perhaps on the back end
            // have the error emitted as a specific message. It is otherwise a little difficult
            // to trace this.
            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-log-deleted'
                },
                handle: function() {
                    stopAutoFetch();
                    console.warn('No job log :( -- it has been deleted');
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
                handle: handleJobStatusUpdate

            });
            externalEventListeners.push(ev);

            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-does-not-exist'
                },
                handle: handleJobDoesNotExistUpdate
            });
            externalEventListeners.push(ev);
        }

        function stopEventListeners() {
            if (externalEventListeners) {
                externalEventListeners.forEach(function(ev) {
                    runtime.bus().removeListener(ev);
                });
            }
        }

        // LIFECYCLE API
        function renderFSM() {
            var state = fsm.getCurrentState();

            // Button state
            if (state.ui.buttons) {
                state.ui.buttons.enabled.forEach(function(button) {
                    ui.enableButton(button);
                });
                state.ui.buttons.disabled.forEach(function(button) {
                    ui.disableButton(button);
                });
            }

            // Element state
            if (state.ui.elements) {
                state.ui.elements.show.forEach(function(element) {
                    ui.showElement(element);
                });
                state.ui.elements.hide.forEach(function(element) {
                    ui.hideElement(element);
                });
            }
        }

        function doOnQueued(message) {
            const noLogYet = {
                lineNumber: undefined,
                text: 'Job is queued, logs will be available when the job is running.'
            }
            const line = buildLine(noLogYet);
            ui.setContent('kb-log.panel', line);
        }

        function doExitQueued(message) {
            ui.setContent('kb-log.panel', '');
        }

        function doJobNotFound(message) {
            ui.setContent('kb-log.panel', div([
                p([
                    'No job found; logs cannot be displayed'
                ])
            ]));
        }

        function initializeFSM() {
            // events emitted by the fsm.
            fsm = Fsm.make({
                states: appStates,
                initialState: {
                    mode: 'new'
                },
                onNewState: function(fsm) {
                    renderFSM(fsm);
                }
            });
            fsm.start();
            fsm.bus.on('on-active', function() {
                startAutoFetch();
            });
            fsm.bus.on('exit-active', function() {
                stopAutoFetch();
            });
            fsm.bus.on('on-canceled', function() {
                requestLatestJobLog();
                stopJobUpdates();
            });
            fsm.bus.on('exit-canceled', function() {
                //  nothing to do?
            });
            fsm.bus.on('on-queued', function(message) {
                doOnQueued(message);
            });
            fsm.bus.on('exit-queued', function(message) {
                doExitQueued(message);
            });
            fsm.bus.on('on-job-not-found', function(message) {
                doJobNotFound(message);
            });
        }

        function startJobUpdates() {
            if (listeningForJob) {
                return;
            }
            runtime.bus().emit('request-job-update', {
                jobId: jobId
            });
            listeningForJob = true;
        }

        function stopJobUpdates() {
            if (listeningForJob) {
                listeningForJob = false;
            }
        }

        function getPanelNode() {
            return document.getElementById(panelId);
        }

        /**
         * The main lifecycle event, called when its container node exists, and we want to start
         * running this widget.
         * This detaches itself first, if it exists, then recreates itself in its host node.
         * @param {object} arg - should have attributes:
         *   - node - a DOM node where it will be hosted.
         *   - jobId - string, a job id for this log
         */
        function start(arg) {
            detach();  // if we're alive, remove ourselves before restarting
            var hostNode = arg.node;
            if (!hostNode) {
                throw new Error('Requires a node to start');
            }
            jobId = arg.jobId;
            if (!jobId) {
                throw new Error('Requires a job id to start');
            }

            container = hostNode.appendChild(document.createElement('div'));
            ui = UI.make({ node: container });

            panelId = html.genId();
            var layout = renderLayout(panelId);
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);
            panel = getPanelNode();

            initializeFSM();
            renderFSM();
            startEventListeners();

            runtime.bus().emit('request-job-status', {
                jobId: jobId
            });
            listeningForJob = true;
        }

        function stop() {
            stopEventListeners();
            stopJobUpdates();
            stopAutoFetch();
            if (requestLoop) {
                clearTimeout(requestLoop);
            }
            if (bus) {
                bus.stop();
            }
            if (fsm) {
                fsm.stop();
            }
            stopped = false;
        }

        function detach() {
            stop();
            if (container) {
                container.remove();
            }
        }

        // MAIN
        model = Props.make({
            data: {
                cache: [],
                lines: [],
                currentLine: null,
                lastLine: null,
                linesPerPage: linesPerPage,
                fetchedAt: null
            },
            onUpdate: function() {
                render();
            }
        });

        // API

        return Object.freeze({
            start: start,
            stop: stop,
            bus: bus,
            detach: detach
        });
    }

    return {
        make: function(config) {
            return factory();
        }
    };
});
