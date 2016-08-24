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
                    buttons: {
                        enabled: [],
                        disabled: ['run-app'],
                        hidden: ['launching', 're-run-app', 'cancel', 'canceling', 'report-error']
                    },
                    elements: {
                        show: [],
                        hide: ['fatal-error', 'parameters-group', 'output-group', 'parameters-display-group', 'exec-group']
                    }
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
                    buttons: {
                        enabled: [],
                        disabled: ['run-app'],
                        hidden: ['launching', 're-run-app', 'cancel', 'canceling', 'report-error']
                    },
                    elements: {
                        show: ['parameters-group', 'output-group'],
                        hide: ['fatal-error', 'parameters-display-group', 'exec-group']
                    }
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
                    buttons: {
                        enabled: ['run-app'],
                        disabled: [],
                        hidden: ['launching', 're-run-app', 'cancel', 'canceling', 'report-error']
                    },
                    elements: {
                        show: ['parameters-group', 'output-group'],
                        hide: ['fatal-error', 'parameters-display-group', 'exec-group']
                    }
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
                    buttons: {
                        enabled: [],
                        disabled: ['launching'],
                        hidden: ['cancel', 'canceling', 'run-app', 're-run-app', 'report-error']
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
                    ]
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
                    buttons: {
                        enabled: [],
                        disabled: ['launching'],
                        hidden: ['cancel', 'canceling', 'run-app', 're-run-app', 'report-error']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
                    }
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
                    buttons: {
                        enabled: ['cancel'],
                        disabled: [],
                        hidden: ['launching', 'canceling', 'run-app', 're-run-app', 'report-error']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
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
                    buttons: {
                        enabled: ['cancel'],
                        disabled: [],
                        hidden: ['launching', 'canceling', 'run-app', 're-run-app', 'report-error']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
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
                    buttons: {
                        enabled: [],
                        disabled: ['canceling'],
                        hidden: ['launching', 'cancel', 'run-app', 're-run-app', 'report-error']
                    },
                    elements: {
                        show: [ 'exec-group', 'output-group'],
                        hide: ['parameters-display-group', 'parameters-group']
                    }
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
                    buttons: {
                        enabled: ['re-run-app'],
                        disabled: [],
                        hidden: ['launching', 'canceling', 'run-app', 'cancel', 'report-error']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
                    }
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
                    buttons: {
                        enabled: ['re-run-app'],
                        disabled: [],
                        hidden: ['launching', 'run-app', 'cancel', 'canceling', 'report-error']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
                    }
                },
                on: {
                    enter: {
                        messages: [
                            {
                                emit: 'on-success'
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
                    buttons: {
                        enabled: ['re-run-app', 'report-error'],
                        disabled: [],
                        hidden: ['launching', 'run-app', 'cancel', 'canceling']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
                    }
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
                    buttons: {
                        enabled: ['re-run-app', 'report-error'],
                        disabled: [],
                        hidden: ['launching', 'run-app', 'cancel', 'canceling']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
                    }
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
                    buttons: {
                        enabled: ['re-run-app', 'report-error'],
                        disabled: [],
                        hidden: ['launching', 'run-app', 'cancel', 'canceling']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
                    }
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
                    buttons: {
                        enabled: ['re-run-app', 'report-error'],
                        disabled: [],
                        hidden: ['launching', 'run-app', 'cancel', 'canceling']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
                    }
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
                    buttons: {
                        enabled: ['report-error'],
                        disabled: [],
                        hidden: ['launching', 're-run-app', 'run-app', 'cancel', 'canceling']
                    },
                    elements: {
                        show: ['fatal-error'],
                        hide: ['parameters-group', 'parameters-display-group', 'exec-group', 'output-group']
                    }
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
