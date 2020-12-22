define([], () => {
    'use strict';
    const states = [
        {
            state: {
                mode: 'new'
            },
            ui: {
                tab: {
                    selected: 'configure',
                    tabs: {
                        configure: {
                            enabled: true,
                            visible: true,
                        },
                        viewConfigure: {
                            enabled: false,
                            visible: false
                        },
                        info: {
                            enabled: true,
                            visible: true
                        },
                        jobStatus: {
                            enabled: true,
                            visible: true
                        },
                        results: {
                            enabled: true,
                            visible: true
                        },
                        error: {
                            enabled: false,
                            visible: false
                        }
                    }
                },
                action: {
                    name: 'runApp',
                    disabled: true
                }
            }
        }
    ];

    return states;
});
