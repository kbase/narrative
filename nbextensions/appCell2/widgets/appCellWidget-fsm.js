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

    const appStates = [
        // new
        {
            state: {
                mode: 'new',
            },
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
            next: [
                {
                    mode: 'internal-error',
                },
                {
                    mode: 'editing',
                    params: 'incomplete',
                },
            ],
        },
        // editing - incomplete
        {
            state: {
                mode: 'editing',
                params: 'incomplete',
            },
            ui: {
                tabs: standardModeTabs,
                actionButton: {
                    name: 'runApp',
                    disabled: true,
                },
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'editing',
                    params: 'incomplete',
                },
                {
                    mode: 'editing-batch',
                    params: 'incomplete',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // editing - complete
        {
            state: {
                mode: 'editing',
                params: 'complete',
                code: 'built',
            },
            ui: {
                tabs: standardModeTabs,
                actionButton: {
                    name: 'runApp',
                    disabled: false,
                },
            },
            next: [
                {
                    mode: 'editing',
                    params: 'incomplete',
                },
                {
                    mode: 'editing-batch',
                    params: 'incomplete',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'execute-requested',
                },
                {
                    mode: 'processing',
                    stage: 'launched',
                },
                {
                    mode: 'processing',
                    stage: 'queued',
                },
                {
                    mode: 'processing',
                    stage: 'running',
                },
                {
                    mode: 'processing',
                    stage: 'partial-complete',
                },
                {
                    mode: 'success',
                },
                {
                    mode: 'error',
                    stage: 'launching',
                },
                {
                    mode: 'error',
                    stage: 'runtime',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // batch editing - incomplete
        {
            state: {
                mode: 'editing-batch',
                params: 'incomplete',
            },
            ui: {
                tabs: batchModeTabs,
                actionButton: {
                    name: 'runApp',
                    disabled: true,
                },
            },
            next: [
                {
                    mode: 'editing-batch',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'editing-batch',
                    params: 'incomplete',
                },
                {
                    mode: 'editing',
                    params: 'incomplete',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // batch editing - complete
        {
            state: {
                mode: 'editing-batch',
                params: 'complete',
                code: 'built',
            },
            ui: {
                tabs: batchModeTabs,
                actionButton: {
                    name: 'runApp',
                    disabled: false,
                },
            },
            next: [
                {
                    mode: 'editing',
                    params: 'incomplete',
                },
                {
                    mode: 'editing-batch',
                    params: 'incomplete',
                },
                {
                    mode: 'editing-batch',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'execute-requested',
                },
                {
                    mode: 'processing',
                    stage: 'launched',
                },
                {
                    mode: 'processing',
                    stage: 'queued',
                },
                {
                    mode: 'processing',
                    stage: 'running',
                },
                {
                    mode: 'processing',
                    stage: 'partial-complete',
                },
                {
                    mode: 'success',
                },
                {
                    mode: 'error',
                    stage: 'launching',
                },
                {
                    mode: 'error',
                    stage: 'runtime',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // execute-requested
        {
            state: {
                mode: 'execute-requested',
            },
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
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'processing',
                    stage: 'launched',
                },
                {
                    mode: 'processing',
                    stage: 'queued',
                },
                {
                    mode: 'processing',
                    stage: 'running',
                },
                {
                    mode: 'processing',
                    stage: 'partial-complete',
                },
                {
                    mode: 'canceled',
                },
                {
                    mode: 'canceling',
                },
                {
                    mode: 'success',
                },
                {
                    mode: 'error',
                    stage: 'launching',
                },
                {
                    mode: 'error',
                    stage: 'runtime',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // processing - launched
        {
            state: {
                mode: 'processing',
                stage: 'launched',
            },
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
                {
                    mode: 'processing',
                    stage: 'launched',
                },
                {
                    mode: 'processing',
                    stage: 'queued',
                },
                {
                    mode: 'processing',
                    stage: 'running',
                },
                {
                    mode: 'processing',
                    stage: 'partial-complete',
                },
                {
                    mode: 'canceled',
                },
                {
                    mode: 'canceling',
                },
                {
                    mode: 'success',
                },
                {
                    mode: 'error',
                    stage: 'launching',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // processing - queued
        {
            state: {
                mode: 'processing',
                stage: 'queued',
            },
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
                {
                    mode: 'processing',
                    stage: 'queued',
                },
                {
                    mode: 'processing',
                    stage: 'running',
                },
                {
                    mode: 'processing',
                    stage: 'partial-complete',
                },
                {
                    mode: 'canceled',
                },
                {
                    mode: 'canceling',
                },
                {
                    mode: 'success',
                },
                // This can happen if there is no in-progress message received
                // before an error occurs.
                {
                    mode: 'error',
                    stage: 'runtime',
                },
                // This can happen if the job disappeared while the app thinks
                // it is queued, yet the user still wants to cancel (which can't really
                // cancel, it just has to return to editing mode).
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // processing - running
        {
            state: {
                mode: 'processing',
                stage: 'running',
            },
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
                {
                    mode: 'processing',
                    stage: 'running',
                },
                {
                    mode: 'processing',
                    stage: 'partial-complete',
                },

                {
                    mode: 'canceled',
                },
                {
                    mode: 'canceling',
                },
                {
                    mode: 'success',
                },
                {
                    mode: 'error',
                    stage: 'runtime',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // processing - partial complete
        {
            state: {
                mode: 'processing',
                stage: 'partial-complete',
            },
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
                    },
                    error: {
                        enabled: false,
                        hidden: true,
                    },
                },
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
                {
                    mode: 'processing',
                    stage: 'partial-complete',
                },
                {
                    mode: 'canceled',
                },
                {
                    mode: 'canceling',
                },
                {
                    mode: 'success',
                },
                {
                    mode: 'error',
                    stage: 'runtime',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // cancelling the app run
        {
            state: {
                mode: 'canceling',
            },
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
                {
                    mode: 'canceled',
                },
                // In case the cancellation request was denied
                {
                    mode: 'processing',
                    stage: 'running',
                },
                // In case the cancelling request did not succeed and the job meanwhile finished.
                {
                    mode: 'success',
                },
                {
                    mode: 'error',
                    stage: 'runtime',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // app run cancelled
        {
            state: {
                mode: 'canceled',
            },
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
                    name: 'reRunApp',
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
            next: [
                {
                    mode: 'canceled',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
            ],
        },
        // success
        {
            state: {
                mode: 'success',
            },
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
                    name: 'reRunApp',
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-success',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'resume-success',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-success',
                        },
                    ],
                },
            },
            next: [
                {
                    mode: 'success',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // launch error
        {
            state: {
                mode: 'error',
                stage: 'launching',
            },
            ui: {
                tabs: uiTabs.error,
                actionButton: {
                    name: 'reRunApp',
                },
            },
            next: [
                {
                    mode: 'error',
                    stage: 'launching',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // error during job execution (including whilst queueing)
        {
            state: {
                mode: 'error',
                stage: 'runtime',
            },
            ui: {
                tabs: uiTabs.error,
                actionButton: {
                    name: 'reRunApp',
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
            next: [
                {
                    mode: 'error',
                    stage: 'runtime',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'internal-error',
                },
            ],
        },
        // A fatal error represents an app cell which cannot operate.
        {
            state: {
                mode: 'internal-error',
            },
            ui: {
                tabs: uiTabs.error,
                actionButton: {
                    name: 'resetApp',
                },
            },
            next: [
                {
                    mode: 'internal-error',
                },
                // We will let a user attempt to reset the app.
                {
                    mode: 'new',
                },
            ],
        },
    ];

    return {
        appStates,
    };
});
