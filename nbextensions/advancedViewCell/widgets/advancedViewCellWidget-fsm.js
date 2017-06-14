define([], function () {
    return [
        {
            state: {
                mode: 'new'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['run-app']
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
                mode: 'fatal-error'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['run-app']
                },
                elements: {
                    show: ['fatal-error'],
                    hide: ['parameters-group', 'output-group', 'parameters-display-group', 'exec-group']
                }
            },
            next: []

        },
        {
            state: {
                mode: 'editing',
                params: 'incomplete'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['run-app']
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
                    disabled: []
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
                    mode: 'processing',
                    stage: 'launching'
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
                }
            ]
        },
        {
            state: {
                mode: 'success'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['run-app']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                }
            },
            on: {
                enter: {
                    messages: [{
                        emit: 'on-success'
                    }]
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
                }
            ]
        },
        {
            state: {
                mode: 'error'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['run-app']
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
                }
            ]
        }
    ];
});