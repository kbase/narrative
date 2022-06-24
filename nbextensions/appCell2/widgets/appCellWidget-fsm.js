define([], () => {
    'use strict';

    const uiTabs = {
        inProgress: {
            info: {
                enabled: true,
            },
            configure: {
                enabled: false,
                hidden: true,
            },
            viewConfigure: {
                enabled: true,
            },
            jobStatus: {
                enabled: true,
            },
            results: {
                enabled: false,
            },
            error: {
                enabled: false,
                hidden: true,
            },
        },
        error: {
            info: {
                enabled: true,
            },
            configure: {
                enabled: false,
                hidden: true,
            },
            viewConfigure: {
                enabled: true,
            },
            jobStatus: {
                enabled: false,
            },
            results: {
                enabled: false,
                hidden: true,
            },
            error: {
                enabled: true,
                selected: true,
            },
        },
    };

    const configureTabSettings = [
            {
                selector: {
                    viewOnly: false,
                },
                settings: {
                    enabled: true,
                    hidden: false,
                    selected: true,
                },
            },
            {
                selector: {
                    viewOnly: true,
                },
                settings: {
                    enabled: false,
                    hidden: true,
                    selected: false,
                },
            },
        ],
        viewConfigureTabSettings = [
            {
                selector: {
                    viewOnly: false,
                },
                settings: {
                    enabled: false,
                    hidden: true,
                    selected: false,
                },
            },
            {
                selector: {
                    viewOnly: true,
                },
                settings: {
                    enabled: true,
                    hidden: false,
                    selected: true,
                },
            },
        ],
        batchModeTabs = {
            info: {
                enabled: true,
            },
            configureBatch: configureTabSettings,
            viewConfigure: viewConfigureTabSettings,
            configure: {
                enabled: false,
                hidden: true,
            },
            jobStatus: {
                enabled: false,
            },
            results: {
                enabled: false,
            },
            error: {
                enabled: false,
                hidden: true,
            },
        },
        standardModeTabs = {
            info: {
                enabled: true,
            },
            configure: configureTabSettings,
            viewConfigure: viewConfigureTabSettings,
            jobStatus: {
                enabled: false,
            },
            results: {
                enabled: false,
            },
            error: {
                enabled: false,
                hidden: true,
            },
        };

    const STATE = {
        NEW: {
            mode: 'new',
        },
        INTERNAL_ERROR: {
            mode: 'internal-error',
        },
        EDITING_INCOMPLETE: {
            mode: 'editing',
            params: 'incomplete',
        },
        EDITING_COMPLETE: {
            mode: 'editing',
            params: 'complete',
            code: 'built',
        },
        EDITING_BATCH_INCOMPLETE: {
            mode: 'editing-batch',
            params: 'incomplete',
        },
        EDITING_BATCH_COMPLETE: {
            mode: 'editing-batch',
            params: 'complete',
            code: 'built',
        },
        EXECUTE_REQUESTED: {
            mode: 'execute-requested',
        },
        PROCESSING_LAUNCHED: {
            mode: 'processing',
            stage: 'launched',
        },
        PROCESSING_QUEUED: {
            mode: 'processing',
            stage: 'queued',
        },
        PROCESSING_RUNNING: {
            mode: 'processing',
            stage: 'running',
        },
        COMPLETED: {
            mode: 'success',
        },
        TERMINATED: {
            mode: 'canceled',
        },
        CANCELING: {
            mode: 'canceling',
        },
        LAUNCH_ERROR: {
            mode: 'error',
            stage: 'launching',
        },
        RUNTIME_ERROR: {
            mode: 'error',
            stage: 'runtime',
        },
    };

    const indexedAppStates = {
        // new
        NEW: {
            state: STATE.NEW,
            ui: {
                tabs: {
                    info: {
                        enabled: true,
                    },
                    configure: {
                        enabled: false,
                    },
                    viewConfigure: {
                        enabled: false,
                        hidden: true,
                    },
                    jobStatus: {
                        enabled: false,
                    },
                    results: {
                        enabled: false,
                    },
                    error: {
                        enabled: false,
                        hidden: true,
                    },
                },
                actionButton: {
                    name: 'runApp',
                    disabled: true,
                },
            },
            next: [STATE.INTERNAL_ERROR, STATE.EDITING_INCOMPLETE, STATE.EDITING_COMPLETE],
        },
        // editing - incomplete
        EDITING_INCOMPLETE: {
            state: STATE.EDITING_INCOMPLETE,
            ui: {
                tabs: standardModeTabs,
                actionButton: {
                    name: 'runApp',
                    disabled: true,
                },
            },
            next: [
                STATE.EDITING_INCOMPLETE,
                STATE.EDITING_COMPLETE,
                STATE.EDITING_BATCH_INCOMPLETE,
                STATE.INTERNAL_ERROR,
            ],
        },
        // editing - complete
        EDITING_COMPLETE: {
            state: STATE.EDITING_COMPLETE,
            ui: {
                tabs: standardModeTabs,
                actionButton: {
                    name: 'runApp',
                    disabled: false,
                },
            },
            next: [
                STATE.EDITING_INCOMPLETE,
                STATE.EDITING_BATCH_INCOMPLETE,
                STATE.EDITING_COMPLETE,
                STATE.EXECUTE_REQUESTED,
                STATE.PROCESSING_LAUNCHED,
                STATE.PROCESSING_QUEUED,
                STATE.PROCESSING_RUNNING,
                STATE.COMPLETED,
                STATE.LAUNCH_ERROR,
                STATE.RUNTIME_ERROR,
                STATE.INTERNAL_ERROR,
            ],
        },
        // batch editing - incomplete
        EDITING_BATCH_INCOMPLETE: {
            state: STATE.EDITING_BATCH_INCOMPLETE,
            ui: {
                tabs: batchModeTabs,
                actionButton: {
                    name: 'runApp',
                    disabled: true,
                },
            },
            next: [
                STATE.EDITING_BATCH_INCOMPLETE,
                STATE.EDITING_BATCH_COMPLETE,
                STATE.EDITING_INCOMPLETE,
                STATE.INTERNAL_ERROR,
            ],
        },
        // batch editing - complete
        EDITING_BATCH_COMPLETE: {
            state: STATE.EDITING_BATCH_COMPLETE,
            ui: {
                tabs: batchModeTabs,
                actionButton: {
                    name: 'runApp',
                    disabled: false,
                },
            },
            next: [
                STATE.EDITING_INCOMPLETE,
                STATE.EDITING_BATCH_INCOMPLETE,
                STATE.EDITING_BATCH_COMPLETE,
                STATE.EXECUTE_REQUESTED,
                STATE.PROCESSING_LAUNCHED,
                STATE.PROCESSING_QUEUED,
                STATE.PROCESSING_RUNNING,
                STATE.COMPLETED,
                STATE.LAUNCH_ERROR,
                STATE.RUNTIME_ERROR,
                STATE.INTERNAL_ERROR,
            ],
        },
        // execute-requested
        EXECUTE_REQUESTED: {
            state: STATE.EXECUTE_REQUESTED,
            doc: [
                'This state is entered when the cell is first executing, and before the back end has received the code and begun processing it.',
                'It is necessary to allow the UI to immediately switch to running mode, as there can be significant latency between ',
                'executing code and receiving the first message that it is being considered for execution.',
            ],
            ui: {
                tabs: {
                    info: {
                        enabled: true,
                    },
                    configure: {
                        enabled: false,
                        hidden: true,
                    },
                    viewConfigure: {
                        enabled: true,
                        selected: false,
                    },
                    jobStatus: {
                        enabled: false,
                        selected: false,
                    },
                    results: {
                        enabled: false,
                    },
                    error: {
                        enabled: false,
                        hidden: true,
                    },
                },
                actionButton: {
                    name: 'cancel',
                    disabled: false,
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-execute-requested',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-execute-requested',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-execute-requested',
                        },
                    ],
                },
            },
            next: [
                STATE.PROCESSING_LAUNCHED,
                STATE.PROCESSING_QUEUED,
                STATE.PROCESSING_RUNNING,
                STATE.COMPLETED,
                STATE.CANCELING,
                STATE.TERMINATED,
                STATE.LAUNCH_ERROR,
                STATE.RUNTIME_ERROR,
                STATE.EDITING_COMPLETE,
                STATE.INTERNAL_ERROR,
            ],
        },
        // processing - launched
        PROCESSING_LAUNCHED: {
            state: STATE.PROCESSING_LAUNCHED,
            ui: {
                tabs: {
                    info: {
                        enabled: true,
                    },
                    configure: {
                        enabled: false,
                        hidden: true,
                    },
                    viewConfigure: {
                        enabled: true,
                    },
                    jobStatus: {
                        enabled: false,
                    },
                    results: {
                        enabled: false,
                    },
                    error: {
                        enabled: false,
                        hidden: true,
                    },
                },
                actionButton: {
                    name: 'cancel',
                    disabled: true,
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-launched',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-launched',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-launched',
                        },
                    ],
                },
            },
            next: [
                STATE.PROCESSING_LAUNCHED,
                STATE.PROCESSING_QUEUED,
                STATE.PROCESSING_RUNNING,
                STATE.COMPLETED,
                STATE.CANCELING,
                STATE.TERMINATED,
                STATE.LAUNCH_ERROR,
                STATE.RUNTIME_ERROR,
                STATE.EDITING_COMPLETE,
                STATE.INTERNAL_ERROR,
            ],
        },
        // processing - queued
        PROCESSING_QUEUED: {
            state: STATE.PROCESSING_QUEUED,
            ui: {
                tabs: uiTabs.inProgress,
                actionButton: {
                    name: 'cancel',
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'start-queueing',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'start-queueing',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'stop-queueing',
                        },
                    ],
                },
            },
            next: [
                STATE.PROCESSING_QUEUED,
                STATE.PROCESSING_RUNNING,
                STATE.COMPLETED,
                STATE.CANCELING,
                STATE.TERMINATED,
                // This can happen if there is no in-progress message received
                // before an error occurs.
                STATE.RUNTIME_ERROR,
                // This can happen if the job disappeared while the app thinks
                // it is queued, yet the user still wants to cancel (which can't really
                // cancel, it just has to return to editing mode).
                STATE.EDITING_COMPLETE,
                STATE.INTERNAL_ERROR,
            ],
        },
        // processing - running
        PROCESSING_RUNNING: {
            state: STATE.PROCESSING_RUNNING,
            ui: {
                tabs: uiTabs.inProgress,
                actionButton: {
                    name: 'cancel',
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'start-running',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'start-running',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'stop-running',
                        },
                    ],
                },
            },
            next: [
                STATE.PROCESSING_RUNNING,
                STATE.COMPLETED,
                STATE.CANCELING,
                STATE.TERMINATED,
                STATE.RUNTIME_ERROR,
                STATE.EDITING_COMPLETE,
                STATE.INTERNAL_ERROR,
            ],
        },
        // cancelling the app run
        CANCELING: {
            state: STATE.CANCELING,
            ui: {
                tabs: uiTabs.inProgress,
                actionButton: {
                    name: 'cancel',
                    default: true,
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-cancelling',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-cancelling',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-cancelling',
                        },
                    ],
                },
            },
            next: [
                STATE.TERMINATED,
                // In case the cancellation request was denied
                STATE.PROCESSING_QUEUED,
                STATE.PROCESSING_RUNNING,
                // In case the cancelling request did not succeed and the job meanwhile finished.
                STATE.COMPLETED,
                STATE.RUNTIME_ERROR,
                STATE.EDITING_COMPLETE,
                STATE.INTERNAL_ERROR,
            ],
        },
        // app run cancelled
        TERMINATED: {
            state: STATE.TERMINATED,
            ui: {
                tabs: {
                    info: {
                        enabled: true,
                    },
                    configure: {
                        enabled: false,
                        hidden: true,
                    },
                    viewConfigure: {
                        enabled: true,
                    },
                    jobStatus: {
                        enabled: true,
                        selected: true,
                    },
                    results: {
                        enabled: false,
                    },
                    error: {
                        enabled: false,
                        hidden: true,
                    },
                },
                actionButton: {
                    name: 'resetApp',
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-cancelled',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-cancelled',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-cancelled',
                        },
                    ],
                },
            },
            next: [STATE.TERMINATED, STATE.EDITING_COMPLETE, STATE.INTERNAL_ERROR],
        },
        // completed
        COMPLETED: {
            state: STATE.COMPLETED,
            ui: {
                tabs: {
                    info: {
                        enabled: true,
                    },
                    configure: {
                        enabled: false,
                        hidden: true,
                    },
                    viewConfigure: {
                        enabled: true,
                    },
                    jobStatus: {
                        enabled: true,
                    },
                    results: {
                        enabled: true,
                        selected: true,
                    },
                    error: {
                        enabled: false,
                        hidden: true,
                    },
                },
                actionButton: {
                    name: 'resetApp',
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-completed',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'resume-completed',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-completed',
                        },
                    ],
                },
            },
            next: [STATE.COMPLETED, STATE.EDITING_COMPLETE, STATE.INTERNAL_ERROR],
        },
        // launch error
        LAUNCH_ERROR: {
            state: STATE.LAUNCH_ERROR,
            ui: {
                tabs: uiTabs.error,
                actionButton: {
                    name: 'resetApp',
                },
            },
            next: [STATE.LAUNCH_ERROR, STATE.EDITING_COMPLETE, STATE.INTERNAL_ERROR],
        },
        // error during job execution (including whilst queueing)
        RUNTIME_ERROR: {
            state: STATE.RUNTIME_ERROR,
            ui: {
                tabs: Object.assign({}, uiTabs.error, { jobStatus: { enabled: true } }),
                actionButton: {
                    name: 'resetApp',
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-error',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-error',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-error',
                        },
                    ],
                },
            },
            next: [STATE.RUNTIME_ERROR, STATE.EDITING_COMPLETE, STATE.INTERNAL_ERROR],
        },
        // A fatal error represents an app cell which cannot operate.
        INTERNAL_ERROR: {
            state: STATE.INTERNAL_ERROR,
            ui: {
                tabs: uiTabs.error,
                actionButton: {
                    name: 'resetApp',
                },
            },
            next: [STATE.INTERNAL_ERROR, STATE.EDITING_INCOMPLETE, STATE.EDITING_COMPLETE],
        },
    };

    return {
        indexedAppStates,
        appStates: Object.values(indexedAppStates),
        STATE,
    };
});
