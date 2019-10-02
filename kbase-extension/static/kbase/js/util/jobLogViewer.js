/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'common/runtime',
    'common/props',
    'common/ui',
    'common/events',
    'common/fsm',
    'kb_common/html',
    'jquery',
    'css!kbase/css/kbaseJobLog.css'
], function(
    Promise,
    Runtime,
    Props,
    UI,
    Events,
    Fsm,
    html,
    $
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        button = t('button'),
        span = t('span'),
        p = t('p'),
        fsm,
        currentSection,
        renderAbove = true,
        smallPanelHeight = '300px',
        largePanelHeight = '600px',
        numLines = 10,
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
                    disabled: ['play', 'stop', 'top', 'back', 'forward', 'bottom']
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
                    disabled: ['play', 'stop', 'top', 'back', 'forward', 'bottom']
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
                    disabled: ['play', 'top', 'back', 'forward', 'bottom']
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
                    enabled: ['play', 'top', 'back', 'forward', 'bottom'],
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
                    enabled: ['top', 'back',  'forward', 'bottom'],
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
                    enabled: ['top', 'back', 'forward', 'bottom'],
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
                    enabled: ['top', 'back', 'forward', 'bottom'],
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
                    disabled: ['play', 'stop', 'top', 'back', 'forward', 'bottom']
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

    function factory(config) {
        var config = config || {},
            runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus({ description: 'Log Viewer Bus' }),
            container,
            jobId,
            model,
            ui,
            linesPerPage = config.linesPerPage || numLines,
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
            ui.showElement('spinner');
            runtime.bus().emit('request-latest-job-log', {
                jobId: jobId,
                options: {
                    num_lines: linesPerPage
                }
            });
        }
        function fetchNewLogs(currentLine) {
            var $panel = $(ui.getElements('panel')[0]),
                first = Number($panel.children().first().attr('class'));
            if (currentLine === 0 && first === 0) {
                return;
            }
            var newFirstLine = currentLine - Number(linesPerPage),
                numLines = linesPerPage;

            if (newFirstLine < 0) {
                newFirstLine = 0;
                numLines = currentLine;
            }
            requestJobLog(newFirstLine, Number(numLines));
            currentSection = newFirstLine;
        }

        function scrollToLog($panel, target, scrollTime){
            if(target.length){
                scrollTime = (scrollTime !== undefined) ? scrollTime : 500;
                $panel.animate({
                    scrollTop: target.offset().top - ($panel.offset().top - $panel.scrollTop())
                }, scrollTime, function () {
                    currentSection = target.parent().attr('class');
                });
            }else{
                fetchNewLogs(Number(model.getItem('currentLine')));
            }

        }

        function doFetchFirstLogChunk() {
            doStopPlayLogs();
            renderAbove = true;

            var currentLine = currentSection ? currentSection : Number(model.getItem('currentLine')),
                $currentSection = $('.' + String(currentLine));

            if ($currentSection.is(':first-child')) {
                fetchNewLogs(currentLine);
            } else {
                var $panel = $(ui.getElements('panel')[0]),
                    target = $panel.children().first().children().first();

                scrollToLog($panel, target);

            }
        }


        function doFetchPreviousLogChunk() {
            doStopPlayLogs();
            renderAbove = true;

            var currentLine = currentSection ? currentSection : Number(model.getItem('currentLine')),
                $currentSection = $('.' + String(currentLine));
            if (!$currentSection.is(':first-child')) {
                var $panel = $(ui.getElements('panel')[0]),
                    target = $currentSection.prev().children().first();
                scrollToLog($panel, target);
            } else {
                fetchNewLogs(currentLine);
            }

        }

        function doFetchNextLogChunk() {
            renderAbove = false;

            doStopPlayLogs();
            var currentLine = currentSection ? currentSection : Number(model.getItem('currentLine')),
                lastLine = model.getItem('lastLine'),
                $panel = $(ui.getElements('panel')[0]);

            var $currentSection = $('.' + String(currentLine));
            currentSection = currentLine;

            if ($currentSection.is(':last-child')) {
                requestJobLog(lastLine);
            } else {
                var target = $currentSection.next().children().last();
                scrollToLog($panel, target);
            }
        }

        function doFetchLastLogChunk() {
            renderAbove = false;

            doStopPlayLogs();
            var $panel = $(ui.getElements('panel')[0]);
            var target = $panel.children().last().children().last();
            scrollToLog($panel, target);
        }
        function test(){
            if(panelHeight === smallPanelHeight){
                panelHeight = largePanelHeight;
            }else{
                panelHeight = smallPanelHeight;
            }
            $(ui.getElements('panel')[0]).animate({height: panelHeight}, 500);
        }

        // VIEW

        function renderControls(events) {
            return div({ dataElement: 'header', style: { margin: '0 0 10px 0' } }, [
                button({
                    class: 'btn btn-sm btn-default',
                    dataButton: 'expand',
                    dataToggle: 'tooltip',
                    dataPlacement: 'top',
                    title: 'Start fetching logs',
                    id: events.addEvent({
                        type: 'click',
                        handler: test
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
                    dataButton: 'back',
                    dataToggle: 'tooltip',
                    dataPlacement: 'top',
                    title: 'Fetch previous log chunk',
                    id: events.addEvent({
                        type: 'click',
                        handler: doFetchPreviousLogChunk
                    })
                }, [
                    span({ class: 'fa fa-angle-up' })
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
                    span({ class: 'fa fa-angle-down' })
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

        function renderLayout() {
            var events = Events.make(),
                content = div({ dataElement: 'kb-log', style: { marginTop: '10px'}}, [
                    div({ class: 'kblog-header' }, [
                        div({ class: 'kblog-num-wrapper' }, [
                            div({ class: 'kblog-line-num' }, [])
                        ]),
                        div({ class: 'kblog-text' }, [
                            renderControls(events)
                        ])
                    ]),
                    div({ dataElement: 'panel',
                        style: {
                            'overflow-y': 'scroll', height: panelHeight
                        } })
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
        //left in because oher methods depend on it
        function renderLine(line) {
            var extraClass = line.isError ? ' kb-error' : '';

            return div({
                class: 'kblog-line' + extraClass
            }, [
                div({ class: 'kblog-num-wrapper' }, [
                    div({ class: 'kblog-line-num' }, [
                        String(line.lineNumber)
                    ])
                ]),
                div({
                    class: 'kblog-text',
                    style: {
                        overflow: 'auto'
                    }
                }, [
                    div({ style: { marginBottom: '6px' } }, sanitize(line.text))
                ])
            ]);
        }
        function renderLine2(line) {
            var extraClass = line.isError ? ' kb-error' : '';
            var $line = $('<div />')
                .addClass('kblog-num-wrapper' )
                .append($('<span />')
                    .addClass('kblog-line-num')
                    .append(String(line.lineNumber)))
                .append($('<span />')
                    .addClass('kblog-text')
                    .append(sanitize(line.text)));
            return $('<div />')
                .addClass('kblog-line' + extraClass)
                .append($line);

        }

        function renderLines(lines) {
            var $section = $('<div/>');
            for(var i = lines.length-1; i>=0; i--){
                $section.prepend(renderLine2(lines[i]));
            }
            $section.addClass(String(model.getItem('currentLine')))
                .mouseenter(function(){
                    currentSection = Number($section.attr('class'));
                });
            return $section;
        }

        function render() {
            var startingLine = model.getItem('currentLine'),
                lines = model.getItem('lines'),
                viewLines,
                $panel;

            if (lines) {
                if (lines.length === 0) {
                    ui.setContent('panel', 'Sorry, no log entries to show');
                    return;
                }
                viewLines = lines.map(function(line, index) {
                    return {
                        text: line.line,
                        isError: (line.is_error === 1 ? true : false),
                        lineNumber: startingLine + index + 1
                    };
                });
                $panel = $(ui.getElements('panel')[0]);
                var autoState = fsm.getCurrentState().state.auto;
                if (!autoState){
                    var target = renderLines(viewLines).css('font-color', 'white');
                    if(renderAbove){
                        var scrollTarget = $panel.children().first();
                        target.prependTo($panel);
                        scrollToLog($panel, scrollTarget, 0);
                        target.css('font-color', 'black');
                    }else{
                        target.appendTo($panel).show();
                    }
                }else{
                    $panel.html(renderLines(viewLines)[0]);
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
            var $panel = $(ui.getElements('panel')[0])
                .on('scroll', function () {
                    //at begining

                    var autoState = fsm.getCurrentState().state.auto;
                    var top = $(this).scrollTop();
                    //when not on autoplay then scrolling to top will fetch new logs
                    if (!autoState &&  top === 0) {
                        var $panel = $(ui.getElements('panel')[0]),
                            $currentSection = $panel.children(':first'),
                            currentLine = Number($currentSection.attr('class'));
                        fetchNewLogs(currentLine);
                    }
                });
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
            ui.setContent('kb-log.panel', renderLine({
                lineNumber: '',
                text: 'Job is queued, logs will be available when the job is running.'
            }));
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

        function start(arg) {
            detach();  // if we're alive, remove ourselves before restarting
            var hostNode = arg.node;
            container = hostNode.appendChild(document.createElement('div'));
            ui = UI.make({ node: container });

            jobId = arg.jobId;

            var layout = renderLayout();
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);

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
                container.innerHTML = '';
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
            return factory(config);
        }
    };
});
