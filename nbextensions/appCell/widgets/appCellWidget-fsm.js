/*global define*/
/*jslint white:true,browser:true*/

define([
], function () {
    'use strict';

    var appStates = [
        {
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
                    },
                    jobState: {
                        enabled: false
                    }
                },
                buttons: {
                    enabled: [],
                    disabled: ['run-app'],
                    hidden: ['launching', 're-run-app', 'cancel', 'canceling']
                },
                elements: {
                    show: [],
                    hide: ['fatal-error', 'parameters-group', 'output-group', 'parameters-display-group', 'exec-group']
                },
                icon: {
                    color: 'black',
                    type: 'minus'
                },
                label: 'new',
                message: ''
            },
            next: [
                {
                    mode: 'fatal-error'
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
                    },
                    jobState: {
                        enabled: false
                    }
                },
                buttons: {
                    enabled: [],
                    disabled: ['run-app'],
                    hidden: ['launching', 're-run-app', 'cancel', 'canceling']
                },
                elements: {
                    show: ['parameters-group', 'output-group'],
                    hide: ['fatal-error', 'parameters-display-group', 'exec-group']
                },
                icon: {
                    color: 'orange',
                    type: 'pencil'
                },
                label: 'editing',
                message: 'You may edit the parameters for this App and then run it'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'editing',
                    params: 'incomplete'
                },
                {
                    mode: 'fatal-error'
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
                    },
                    jobState: {
                        enabled: false
                    }
                },
                buttons: {
                    enabled: ['run-app'],
                    disabled: [],
                    hidden: ['launching', 're-run-app', 'cancel', 'canceling']
                },
                elements: {
                    show: ['parameters-group', 'output-group'],
                    hide: ['fatal-error', 'parameters-display-group', 'exec-group']
                },
                icon: {
                    color: 'green',
                    type: 'pencil'
                },
                label: 'editing',
                message: 'You have completed the required parameters for this App; you may run it or continue to edit parameters.'
            },
            next: [
                {
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
                    mode: 'fatal-error'
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
                'executing code and receiving the first message that it has is being considered for excecution.'
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
                    },
                    jobState: {
                        enabled: false
                    }
                },
                buttons: {
                    enabled: [],
                    disabled: ['launching'],
                    hidden: ['cancel', 'canceling', 'run-app', 're-run-app']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                messages: [
                    {
                        widget: 'paramsDisplayWidget',
                        message: {},
                        address: {
                            key: {
                                type: 'sync-all-parameters'
                            }
                        }
                    }
                ],
                icon: {
                    color: 'blue',
                    type: 'rocket'
                },
                label: 'launching...',
                message: 'Launching the app...'
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'sync-all-display-parameters'
                        }
                    ]
                },
                resume: {
                    messages: [
                        {
                            emit: 'sync-all-display-parameters'
                        }
                    ]
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
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'fatal-error'
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
                    },
                    jobState: {
                        enabled: false
                    }
                },
                buttons: {
                    enabled: [],
                    disabled: ['launching'],
                    hidden: ['cancel', 'canceling', 'run-app', 're-run-app']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                icon: {
                    color: 'green',
                    type: 'rocket'
                },
                label: 'executing...',
                message: 'The app has now entered the execution engine'
            },
            on: {
                resume: {
                    messages: [
                        {
                            emit: 'sync-all-display-parameters'
                        }
                    ]
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
                    mode: 'error',
                    stage: 'launching'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'fatal-error'
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
                    },
                    jobState: {
                        enabled: true
                    }
                },
                buttons: {
                    enabled: ['cancel'],
                    disabled: [],
                    hidden: ['launching', 'canceling', 'run-app', 're-run-app']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                icon: {
                    color: 'green',
                    type: 'list'
                },
                label: 'queued...',
                message: 'The app is queued for running.'
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'start-queueing'
                        }
                    ]
                },
                resume: {
                    messages: [
                        {
                            emit: 'start-queueing'
                        }
                    ]
                },
                exit: {
                    messages: [
                        {
                            emit: 'stop-queueing'
                        }
                    ]
                }
            },
            next: [
                {
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
                    mode: 'error',
                    stage: 'queued'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'fatal-error'
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
                    },
                    jobState: {
                        enabled: true
                    }
                },
                buttons: {
                    enabled: ['cancel'],
                    disabled: [],
                    hidden: ['launching', 'canceling', 'run-app', 're-run-app']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                icon: {
                    color: 'green',
                    type: 'bolt'
                },
                label: 'running...',
                message: 'The app is now running.'
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'start-running'
                        }
                    ]
                },
                resume: {
                    messages: [
                        {
                            emit: 'start-running'
                        }
                    ]
                },
                exit: {
                    messages: [
                        {
                            emit: 'stop-running'
                        }
                    ]
                }
            },
            next: [
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
                    mode: 'error',
                    stage: 'running'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'fatal-error'
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
                    },
                    jobState: {
                        enabled: true
                    }
                },
                buttons: {
                    enabled: [],
                    disabled: ['canceling'],
                    hidden: ['launching', 'cancel', 'run-app', 're-run-app']
                },
                elements: {
                    show: ['exec-group', 'output-group'],
                    hide: ['parameters-display-group', 'parameters-group']
                },
                icon: {
                    color: 'orange',
                    type: 'bolt'
                },
                label: 'canceling...',
                message: 'Canceling the app...'
            },
            next: [
                {
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
                    mode: 'fatal-error'
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
                    },
                    jobState: {
                        enabled: true
                    }
                },
                buttons: {
                    enabled: ['re-run-app'],
                    disabled: [],
                    hidden: ['launching', 'canceling', 'run-app', 'cancel']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                icon: {
                    color: 'red',
                    type: 'ban'
                },
                label: 'canceled',
                message: 'The app execution has been successfully canceled'
            },
            next: [
                {
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
                    },
                    jobState: {
                        enabled: true
                    }
                },
                buttons: {
                    enabled: ['re-run-app'],
                    disabled: [],
                    hidden: ['launching', 'run-app', 'cancel', 'canceling']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                icon: {
                    color: 'green',
                    type: 'check'
                },
                label: 'completed',
                message: 'The app has successfully run'
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-success'
                        }
                    ]
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-success'
                        }
                    ]
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-success'
                        }
                    ]
                }                
            },
            next: [
                {
                    mode: 'success'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'fatal-error'
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
                    },
                    jobState: {
                        enabled: true
                    }
                },
                buttons: {
                    enabled: ['re-run-app'],
                    disabled: [],
                    hidden: ['launching', 'run-app', 'cancel', 'canceling']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                icon: {
                    color: 'red',
                    type: 'exclamation-circle'
                },
                label: 'error',
                message: 'There was an error launching the app'
            },
            next: [
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
                    mode: 'fatal-error'
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
                    },
                    jobState: {
                        enabled: true
                    }
                },
                buttons: {
                    enabled: ['re-run-app'],
                    disabled: [],
                    hidden: ['launching', 'run-app', 'cancel', 'canceling']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                icon: {
                    color: 'red',
                    type: 'exclamation-circle'
                },
                label: 'error',
                message: 'An error was encountered while the app was queued'
            },
            next: [
                {
                    mode: 'error',
                    stage: 'queued'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'fatal-error'
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
                        enabled: false
                    },
                    results: {
                        enabled: true,
                        hidden: true
                    },
                    error: {
                        enabled: true,
                        selected: true
                    },
                    jobState: {
                        enabled: true
                    }
                },
                buttons: {
                    enabled: ['re-run-app'],
                    disabled: [],
                    hidden: ['launching', 'run-app', 'cancel', 'canceling']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                icon: {
                    color: 'red',
                    type: 'exclamation-circle'
                },
                label: 'error',
                message: 'An error was encountered running the app'
            },
            next: [
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
                    mode: 'fatal-error'
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
                    },
                    jobState: {
                        enabled: true
                    }
                },
                buttons: {
                    enabled: ['re-run-app'],
                    disabled: [],
                    hidden: ['launching', 'run-app', 'cancel', 'canceling']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                },
                icon: {
                    color: 'red',
                    type: 'exclamation-circle'
                },
                label: 'error',
                message: 'An error was encountered'
            },
            next: [
                {
                    mode: 'error'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'fatal-error'
                }
            ]
        },
        // A fatal error represents an app cell which cannot operate.
        {
            state: {
                mode: 'fatal-error'
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
                    },
                    jobState: {
                        enabled: true
                    }
                },
                buttons: {
                    enabled: [],
                    disabled: [],
                    hidden: ['launching', 're-run-app', 'run-app', 'cancel', 'canceling']
                },
                elements: {
                    show: ['fatal-error'],
                    hide: ['parameters-group', 'parameters-display-group', 'exec-group', 'output-group']
                },
                icon: {
                    color: 'red',
                    type: 'exclamation-circle'
                },
                label: 'error',
                message: 'A fatal error was encountered'
            },
            next: [
                {
                    mode: 'fatal-error'
                }
            ]
        }

    ];

    return appStates;
});
