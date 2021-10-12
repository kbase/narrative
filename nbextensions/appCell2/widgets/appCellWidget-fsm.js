define([], () => {
    'use strict';

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
                elements: {
                    show: [],
                    hide: [
                        'internal-error',
                        'parameters-group',
                        'output-group',
                        'parameters-display-group',
                        'exec-group',
                    ],
                },
                appStatus: {
                    classes: ['kb-app-status-default'],
                    icon: {
                        type: 'minus',
                    },
                },
                label: 'new',
                message: '',
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
                tabs: {
                    info: {
                        enabled: true,
                    },
                    configure: [
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
                    viewConfigure: [
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
                elements: {
                    show: ['parameters-group', 'output-group'],
                    hide: ['internal-error', 'parameters-display-group', 'exec-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-warning'],
                    icon: {
                        type: 'pencil',
                    },
                },
                label: 'editing',
                message:
                    'You may edit the parameters for this App. You must fill in all required parameters (indicated by red arrows) before you can run the App.',
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
                tabs: {
                    info: {
                        enabled: true,
                    },
                    configure: [
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
                    viewConfigure: [
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
                    disabled: false,
                },
                elements: {
                    show: ['parameters-group', 'output-group'],
                    hide: ['internal-error', 'parameters-display-group', 'exec-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-ok'],
                    icon: {
                        type: 'pencil',
                    },
                },
                label: 'editing',
                message:
                    'You have completed the required parameters for this App; you may run it or continue to edit parameters.',
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
                    stage: 'queued',
                },
                {
                    mode: 'error',
                    stage: 'running',
                },
                {
                    mode: 'error',
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
                tabs: {
                    info: {
                        enabled: true,
                    },
                    configureBatch: [
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
                    viewConfigure: [
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
                actionButton: {
                    name: 'runApp',
                    disabled: true,
                },
                elements: {
                    show: ['parameters-group', 'output-group'],
                    hide: ['internal-error', 'parameters-display-group', 'exec-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-warning'],
                    icon: {
                        type: 'pencil',
                    },
                },
                label: 'editing',
                message:
                    'You may edit the parameters for this App. You must fill in all required parameters (indicated by red arrows) before you can run the App.',
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
                tabs: {
                    info: {
                        enabled: true,
                    },
                    configureBatch: [
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
                    viewConfigure: [
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
                actionButton: {
                    name: 'runApp',
                    disabled: false,
                },
                elements: {
                    show: ['parameters-group', 'output-group'],
                    hide: ['internal-error', 'parameters-display-group', 'exec-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-ok'],
                    icon: {
                        type: 'pencil',
                    },
                },
                label: 'editing',
                message:
                    'You have completed the required parameters for this App; you may run it or continue to edit parameters.',
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
                    stage: 'queued',
                },
                {
                    mode: 'error',
                    stage: 'running',
                },
                {
                    mode: 'error',
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
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group'],
                },
                messages: [
                    {
                        widget: 'paramsDisplayWidget',
                        message: {},
                        address: {
                            key: {
                                type: 'sync-all-parameters',
                            },
                        },
                    },
                ],
                appStatus: {
                    classes: ['kb-app-status-primary'],
                    icon: {
                        color: 'blue',
                        type: 'rocket',
                    },
                },
                label: 'sending...',
                message: 'Launching the App...',
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
                },
                {
                    mode: 'error',
                    stage: 'launching',
                },
                {
                    mode: 'error',
                    stage: 'running',
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
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-ok'],
                    icon: {
                        type: 'rocket',
                    },
                },
                label: 'executing...',
                message: 'The App has now entered the execution engine.',
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
                        enabled: false,
                    },
                    error: {
                        enabled: false,
                        hidden: true,
                    },
                },
                actionButton: {
                    name: 'cancel',
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-ok'],
                    icon: {
                        type: 'list',
                    },
                },
                label: 'queued',
                message: 'The App is queued for running.',
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
                {
                    mode: 'error',
                },
                {
                    mode: 'error',
                    stage: 'queued',
                },
                // This can happen if there is no in-progress message received
                // before an error occurs.
                {
                    mode: 'error',
                    stage: 'running',
                },
                // This can happen if the job disappeared while the app thinks
                // it is queued, yet the user still wants to cancel (which can't really
                // cancel, it just has to return to editing mode.
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
                        enabled: false,
                    },
                    error: {
                        enabled: false,
                        hidden: true,
                    },
                },
                actionButton: {
                    name: 'cancel',
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-ok'],
                    icon: {
                        type: 'bolt',
                    },
                },
                label: 'running',
                message: 'The App is now running.',
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
                },
                {
                    mode: 'error',
                    stage: 'running',
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
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-ok'],
                    icon: {
                        type: 'bolt',
                    },
                },
                label: 'running',
                message: 'The App is now running.',
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
                },
                {
                    mode: 'error',
                    stage: 'running',
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
                        enabled: false,
                    },
                    error: {
                        enabled: false,
                        hidden: true,
                    },
                },
                actionButton: {
                    name: 'cancel',
                    default: true,
                },
                elements: {
                    show: ['exec-group', 'output-group'],
                    hide: ['parameters-display-group', 'parameters-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-warning'],
                    icon: {
                        type: 'bolt',
                    },
                },
                label: 'canceling...',
                message: 'Canceling App execution...',
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
                    stage: 'running',
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
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-error'],
                    icon: {
                        type: 'ban',
                    },
                },
                label: 'canceled',
                message: 'App execution has been successfully canceled.',
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
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-ok'],
                    icon: {
                        type: 'check',
                    },
                },
                label: 'finished',
                message: 'The App has successfully finished.',
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
                        hidden: true,
                    },
                    error: {
                        enabled: true,
                        selected: true,
                    },
                },
                actionButton: {
                    name: 'reRunApp',
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-danger'],
                    icon: {
                        type: 'exclamation-circle',
                    },
                },
                label: 'error',
                message: 'There was an error launching the App.',
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
        // error during queueing
        {
            state: {
                mode: 'error',
                stage: 'queued',
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
                        hidden: true,
                    },
                    error: {
                        enabled: true,
                        selected: true,
                    },
                },
                actionButton: {
                    name: 'reRunApp',
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-danger'],
                    icon: {
                        type: 'exclamation-circle',
                    },
                },
                label: 'error',
                message: 'An error was encountered while the App was queued.',
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
                    stage: 'queued',
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
        // runtime app error
        {
            state: {
                mode: 'error',
                stage: 'running',
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
                        hidden: true,
                    },
                    error: {
                        enabled: true,
                        selected: true,
                    },
                },
                actionButton: {
                    name: 'reRunApp',
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group'],
                },
                appStatus: {
                    classes: ['kb-app-status-danger'],
                    icon: {
                        type: 'exclamation-circle',
                    },
                },
                label: 'error',
                message: 'An error was encountered running the App.',
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
                    stage: 'running',
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
        // Just a plain error state ... not sure how we get here...
        {
            state: {
                mode: 'error',
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
                        hidden: true,
                    },
                    error: {
                        enabled: true,
                        selected: true,
                    },
                },
                actionButton: {
                    name: 'reRunApp',
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group'],
                },
                appStatus: {
                    classes: ['kb-status-danger'],
                    icon: {
                        type: 'exclamation-circle',
                    },
                },
                label: 'error',
                message: 'An error was encountered.',
            },
            next: [
                {
                    mode: 'error',
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
                tabs: {
                    info: {
                        enabled: true,
                    },
                    configure: {
                        enabled: false,
                        hidden: true,
                    },
                    viewConfigure: {
                        enabled: false,
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
                actionButton: {
                    name: 'resetApp',
                },
                elements: {
                    show: ['internal-error'],
                    hide: [
                        'parameters-group',
                        'parameters-display-group',
                        'exec-group',
                        'output-group',
                    ],
                },
                appStatus: {
                    classes: ['kb-status-danger'],
                    icon: {
                        type: 'exclamation-circle',
                    },
                },
                label: 'error',
                message: 'An internal error was encountered.',
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
