/*global define*/
/*jslint white:true,browser:true*/

define([], function () {
    'use strict';

    var appStates = [{
            state: {
                mode: 'new'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: false
                    },
                    viewConfigure: {
                        enabled: false,
                        hidden: true
                    },
                    logs: {
                        enabled: false
                    },
                    runStats: {
                        enabled: false
                    },
                    results: {
                        enabled: false
                    },
                    error: {
                        enabled: false,
                        hidden: true
                    }
                },
                actionButton: {
                    name: 'runApp',
                    disabled: true
                },
                elements: {
                    show: [],
                    hide: ['internal-error', 'parameters-group', 'output-group', 'parameters-display-group', 'exec-group']
                },
                appStatus: {
                    classes: ['kb-app-status-default'],
                    icon: {
                        xcolor: 'black',
                        type: 'minus'
                    }
                },
                label: 'new',
                message: ''
            },
            next: [{
                    mode: 'internal-error'
                },
                {
                    mode: 'editing',
                    params: 'incomplete'
                }
            ]
        },
        {
            state: {
                mode: 'editing',
                params: 'incomplete'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: true,
                        selected: true
                    },
                    viewConfigure: {
                        enabled: false,
                        hidden: true
                    },
                    logs: {
                        enabled: false
                    },
                    runStats: {
                        enabled: false
                    },
                    results: {
                        enabled: false
                    },
                    error: {
                        enabled: false,
                        hidden: true
                    }
                },
                actionButton: {
                    name: 'runApp',
                    disabled: true
                },
                elements: {
                    show: ['parameters-group', 'output-group'],
                    hide: ['internal-error', 'parameters-display-group', 'exec-group']
                },
                appStatus: {
                    classes: ['kb-app-status-warning'],
                    icon: {
                        xcolor: 'orange',
                        type: 'pencil'
                    }
                },
                label: 'editing',
                message: 'You may edit the parameters for this App. You must fill in all required parameters (indicated by red arrows) before you can run the App.'
            },
            next: [{
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'editing',
                    params: 'incomplete'
                },
                {
                    mode: 'internal-error'
                }
            ]
        },
        {
            state: {
                mode: 'editing',
                params: 'complete',
                code: 'built'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: true,
                        selected: true
                    },
                    viewConfigure: {
                        enabled: false,
                        hidden: true
                    },
                    logs: {
                        enabled: false
                    },
                    runStats: {
                        enabled: false
                    },
                    results: {
                        enabled: false
                    },
                    error: {
                        enabled: false,
                        hidden: true
                    }
                },
                actionButton: {
                    name: 'runApp',
                    disabled: false
                },
                elements: {
                    show: ['parameters-group', 'output-group'],
                    hide: ['internal-error', 'parameters-display-group', 'exec-group']
                },
                appStatus: {
                    classes: ['kb-app-status-ok'],
                    icon: {
                        xcolor: 'green',
                        type: 'pencil'
                    }
                },
                label: 'editing',
                message: 'You have completed the required parameters for this App; you may run it or continue to edit parameters.'
            },
            next: [{
                    mode: 'editing',
                    params: 'incomplete'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'execute-requested'
                },
                {
                    mode: 'processing',
                    state: 'launched'
                },
                {
                    mode: 'processing',
                    stage: 'queued'
                },
                {
                    mode: 'processing',
                    stage: 'running'
                },
                {
                    mode: 'success'
                },
                {
                    mode: 'error',
                    stage: 'launching'
                },
                {
                    mode: 'error',
                    stage: 'queued'
                },
                {
                    mode: 'error',
                    stage: 'running'
                },
                {
                    mode: 'error'
                },
                {
                    mode: 'internal-error'
                }
            ]
        },
        {
            state: {
                mode: 'execute-requested'
            },
            doc: [
                'This state is entered when the cell is first executing, and before the back end has received the code and begun processing it.',
                'It is necessary to allow the UI to immediately switch to running mode, as there can be significant latency between ',
                'executing code and receiving the first message that it is being considered for excecution.'
            ],
            ui: {
                tabs: {
                    configure: {
                        enabled: false,
                        hidden: true
                    },
                    viewConfigure: {
                        enabled: true,
                        selected: true
                    },
                    logs: {
                        enabled: false
                    },
                    runStats: {
                        enabled: false
                    },
                    results: {
                        enabled: false
                    },
                    error: {
                        enabled: false,
                        hidden: true
                    }
                },
                actionButton: {
                    name: 'cancel',
                    disabled: true
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                messages: [{
                    widget: 'paramsDisplayWidget',
                    message: {},
                    address: {
                        key: {
                            type: 'sync-all-parameters'
                        }
                    }
                }],
                appStatus: {
                    classes: ['kb-app-status-primary'],
                    icon: {
                        color: 'blue',
                        type: 'rocket'
                    }
                },
                label: 'sending...',
                message: 'Launching the App...'
            },
            on: {
                enter: {
                    messages: [{
                        emit: 'sync-all-display-parameters'
                    }]
                },
                resume: {
                    messages: [{
                        emit: 'sync-all-display-parameters'
                    }]
                }
            },
            next: [
                {
                    mode: 'processing',
                    stage: 'launched'
                },
                {
                    mode: 'error'
                },
                {
                    mode: 'error',
                    stage: 'launching'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'internal-error'
                }
            ]
        },
        {
            state: {
                mode: 'processing',
                stage: 'launched'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: false,
                        hidden: true
                    },
                    viewConfigure: {
                        enabled: true,
                        selected: true
                    },
                    logs: {
                        enabled: false
                    },
                    runStats: {
                        enabled: false
                    },
                    results: {
                        enabled: false
                    },
                    error: {
                        enabled: false,
                        hidden: true
                    }
                },
                actionButton: {
                    name: 'cancel',
                    disabled: true
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                appStatus: {
                    classes: ['kb-app-status-ok'],
                    icon: {
                        xcolor: 'green',
                        type: 'rocket'
                    }
                },
                label: 'executing...',
                message: 'The App has now entered the execution engine.'
            },
            on: {
                resume: {
                    messages: [{
                        emit: 'sync-all-display-parameters'
                    }]
                }
            },
            next: [
                {
                    mode: 'processing',
                    stage: 'launched'
                },
                {
                    mode: 'processing',
                    stage: 'queued'
                },
                {
                    mode: 'processing',
                    stage: 'running'
                },
                {
                    mode: 'canceled'
                },
                {
                    mode: 'canceling'
                },
                {
                    mode: 'success'
                },
                {
                    mode: 'error'
                },
                {
                    mode: 'error',
                    stage: 'launching'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'internal-error'
                }
            ]
        },
        {
            state: {
                mode: 'processing',
                stage: 'queued'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: false,
                        hidden: true
                    },
                    viewConfigure: {
                        enabled: true
                    },
                    logs: {
                        enabled: false
                    },
                    runStats: {
                        enabled: true,
                        selected: true
                    },
                    results: {
                        enabled: false
                    },
                    error: {
                        enabled: false,
                        hidden: true
                    }
                },
                actionButton: {
                    name: 'cancel'
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                appStatus: {
                    classes: ['kb-app-status-ok'],
                    icon: {
                        xcolor: 'green',
                        type: 'list'
                    }
                },
                label: 'queued...',
                message: 'The App is queued for running.'
            },
            on: {
                enter: {
                    messages: [{
                        emit: 'start-queueing'
                    }]
                },
                resume: {
                    messages: [{
                        emit: 'start-queueing'
                    }]
                },
                exit: {
                    messages: [{
                        emit: 'stop-queueing'
                    }]
                }
            },
            next: [{
                    mode: 'processing',
                    stage: 'running'
                },
                {
                    mode: 'processing',
                    stage: 'queued'
                },
                {
                    mode: 'canceled'
                },
                {
                    mode: 'canceling'
                },
                {
                    mode: 'success'
                },
                {
                    mode: 'error'
                },
                {
                    mode: 'error',
                    stage: 'queued'
                },
                // This can happen if there is no in-progress message received
                // before an error occurs.
                {
                    mode: 'error',
                    stage: 'running'
                },
                // This can happen if the job disappeared while the app thinks
                // it is queued, yet the user still wants to cancel (which can't really
                // cancel, it just has to return to editing mode.
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'internal-error'
                }
            ]
        },
        {
            state: {
                mode: 'processing',
                stage: 'running'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: false,
                        hidden: true
                    },
                    viewConfigure: {
                        enabled: true
                    },
                    logs: {
                        enabled: true,
                        selected: true
                    },
                    runStats: {
                        enabled: true
                    },
                    results: {
                        enabled: false
                    },
                    error: {
                        enabled: false,
                        hidden: true
                    }
                },
                actionButton: {
                    name: 'cancel'
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                appStatus: {
                    classes: ['kb-app-status-ok'],
                    icon: {
                        xcolor: 'green',
                        type: 'bolt'
                    }
                },
                label: 'running...',
                message: 'The App is now running.'
            },
            on: {
                enter: {
                    messages: [{
                        emit: 'start-running'
                    }]
                },
                resume: {
                    messages: [{
                        emit: 'start-running'
                    }]
                },
                exit: {
                    messages: [{
                        emit: 'stop-running'
                    }]
                }
            },
            next: [{
                    mode: 'processing',
                    stage: 'running'
                },
                {
                    mode: 'canceled'
                },
                {
                    mode: 'canceling'
                },
                {
                    mode: 'success'
                },
                {
                    mode: 'error'
                },
                {
                    mode: 'error',
                    stage: 'running'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'internal-error'
                }
            ]
        },
        {
            state: {
                mode: 'canceling'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: false,
                        hidden: true
                    },
                    viewConfigure: {
                        enabled: true
                    },
                    logs: {
                        enabled: false
                    },
                    runStats: {
                        enabled: true
                    },
                    results: {
                        enabled: false
                    },
                    error: {
                        enabled: false,
                        hidden: true
                    }
                },
                actionButton: {
                    name: 'cancel',
                    default: true
                },
                elements: {
                    show: ['exec-group', 'output-group'],
                    hide: ['parameters-display-group', 'parameters-group']
                },
                appStatus: {
                    classes: ['kb-app-status-warning'],
                    icon: {
                        xcolor: 'orange',
                        type: 'bolt'
                    }
                },
                label: 'canceling...',
                message: 'Canceling App execution...'
            },
            next: [{
                    mode: 'canceled'
                },
                // In case the cancelation request was denied
                {
                    mode: 'processing',
                    stage: 'running'
                },
                // In case the cancelling request did not succeed and the job meanwhile finished.
                {
                    mode: 'success'
                },
                {
                    mode: 'error',
                    stage: 'running'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'internal-error'
                }
            ]

        },
        {
            state: {
                mode: 'canceled'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: false,
                        hidden: true
                    },
                    viewConfigure: {
                        enabled: true
                    },
                    logs: {
                        enabled: false
                    },
                    runStats: {
                        enabled: true,
                        selected: true
                    },
                    results: {
                        enabled: false
                    },
                    error: {
                        enabled: false,
                        hidden: true
                    }
                },
                actionButton: {
                    name: 'reRunApp'
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                appStatus: {
                    classes: ['kb-app-status-error'],
                    icon: {
                        xcolor: 'red',
                        type: 'ban'
                    }
                },
                label: 'canceled',
                message: 'App execution has been successfully canceled.'
            },
            next: [{
                    mode: 'canceled'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]
        },
        {
            state: {
                mode: 'success'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: false,
                        hidden: true
                    },
                    viewConfigure: {
                        enabled: true
                    },
                    logs: {
                        enabled: true
                    },
                    runStats: {
                        enabled: true
                    },
                    results: {
                        enabled: true,
                        selected: true
                    },
                    error: {
                        enabled: false,
                        hidden: true
                    }
                },
                actionButton: {
                    name: 'reRunApp'
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                appStatus: {
                    classes: ['kb-app-status-ok'],
                    icon: {
                        xcolor: 'green',
                        type: 'check'
                    }
                },
                label: 'completed',
                message: 'The App has successfully finished.'
            },
            on: {
                enter: {
                    messages: [{
                        emit: 'on-success'
                    }]
                },
                resume: {
                    messages: [{
                        emit: 'on-success'
                    }]
                },
                exit: {
                    messages: [{
                        emit: 'exit-success'
                    }]
                }
            },
            next: [{
                    mode: 'success'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'internal-error'
                }
            ]
        },
        {
            state: {
                mode: 'error',
                stage: 'launching'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: false,
                        hidden: true
                    },
                    viewConfigure: {
                        enabled: true
                    },
                    logs: {
                        enabled: false
                    },
                    runStats: {
                        enabled: false
                    },
                    results: {
                        enabled: false,
                        hidden: true
                    },
                    error: {
                        enabled: true,
                        selected: true
                    }
                },
                actionButton: {
                    name: 'reRunApp'
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                appStatus: {
                    classes: ['kb-app-status-danger'],
                    icon: {
                        xcolor: 'red',
                        type: 'exclamation-circle'
                    }
                },
                label: 'error',
                message: 'There was an error launching the App.'
            },
            next: [{
                    mode: 'error',
                    stage: 'launching'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'internal-error'
                }
            ]

        },
        {
            state: {
                mode: 'error',
                stage: 'queued'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: false,
                        hidden: true
                    },
                    viewConfigure: {
                        enabled: true
                    },
                    logs: {
                        enabled: false
                    },
                    runStats: {
                        enabled: false
                    },
                    results: {
                        enabled: false,
                        hidden: true
                    },
                    error: {
                        enabled: true,
                        selected: true
                    }
                },
                actionButton: {
                    name: 'reRunApp'
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                appStatus: {
                    classes: ['kb-app-status-danger'],
                    icon: {
                        xcolor: 'red',
                        type: 'exclamation-circle'
                    }
                },
                label: 'error',
                message: 'An error was encountered while the App was queued.'
            },
            next: [{
                    mode: 'error',
                    stage: 'queued'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'internal-error'
                }
            ]

        },
        {
            state: {
                mode: 'error',
                stage: 'running'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: false,
                        hidden: true
                    },
                    viewConfigure: {
                        enabled: true
                    },
                    logs: {
                        enabled: true
                    },
                    runStats: {
                        enabled: true
                    },
                    results: {
                        enabled: true,
                        hidden: true
                    },
                    error: {
                        enabled: true,
                        selected: true
                    }
                },
                actionButton: {
                    name: 'reRunApp'
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                appStatus: {
                    classes: ['kb-app-status-danger'],
                    icon: {
                        xcolor: 'red',
                        type: 'exclamation-circle'
                    }
                },
                label: 'error',
                message: 'An error was encountered running the App.'
            },
            next: [{
                    mode: 'error',
                    stage: 'running'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'internal-error'
                }
            ]
        },
        // Just a plain error state ... not sure how we get here...
        {
            state: {
                mode: 'error'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: false,
                        hidden: true
                    },
                    viewConfigure: {
                        enabled: true
                    },
                    logs: {
                        enabled: false
                    },
                    runStats: {
                        enabled: false
                    },
                    results: {
                        enabled: false,
                        hidden: true
                    },
                    error: {
                        enabled: true,
                        selected: true
                    }
                },
                actionButton: {
                    name: 'reRunApp'
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                appStatus: {
                    classes: ['kb-status-danger'],
                    icon: {
                        xcolor: 'red',
                        type: 'exclamation-circle'
                    }
                },
                label: 'error',
                message: 'An error was encountered.'
            },
            next: [{
                    mode: 'error'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'internal-error'
                }
            ]
        },
        // A fatal error represents an app cell which cannot operate.
        {
            state: {
                mode: 'internal-error'
            },
            ui: {
                tabs: {
                    configure: {
                        enabled: false,
                        hidden: true
                    },
                    viewConfigure: {
                        enabled: false
                    },
                    logs: {
                        enabled: false
                    },
                    runStats: {
                        enabled: false
                    },
                    results: {
                        enabled: false,
                        hidden: true
                    },
                    error: {
                        enabled: true,
                        selected: true
                    }
                },
                actionButton: {
                    name: 'resetApp'
                },
                elements: {
                    show: ['internal-error'],
                    hide: ['parameters-group', 'parameters-display-group', 'exec-group', 'output-group']
                },
                appStatus: {
                    classes: ['kb-status-danger'],
                    icon: {
                        xcolor: 'red',
                        type: 'exclamation-circle'
                    }
                },
                label: 'error',
                message: 'An internal error was encountered.'
            },
            next: [{
                    mode: 'internal-error'
                },
                // We will let a user attempt to reset the app.
                {
                    mode: 'new'
                }
            ]
        }

    ];

    return appStates;
});