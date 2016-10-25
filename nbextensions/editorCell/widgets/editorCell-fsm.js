/*global define*/
/*jslint browser:true,white:true*/

define([], function () {
    var fsm = [
        {   
            // The 'new' state is the initial entry point for the editor.
            // When the editor is first instantiated and the editor state loaded,
            // it is evaluated and the next state selected.
            state: {
                mode: 'new'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['save']
                },
                elements: {
                    show: [],
                    hide: ['fatal-error', 'parameters-group']
                }
            },
            next: [
                {
                    mode: 'fatal-error'
                },
                {
                    mode: 'editing',
                    params: 'incomplete',
                    data: 'clean'
                }, 
                {
                    mode: 'editing',
                    params: 'complete',
                    data: 'clean'
                }, 
                // remove this!!!
                {
                    mode: 'editing',
                    params: 'complete',
                    data: 'changed'
                }
            ]
        },
        {
            state: {
                mode: 'editing',
                params: 'incomplete',
                data: 'clean'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['save']
                },
                elements: {
                    show: ['parameters-group'],
                    hide: ['fatal-error']
                }
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    data: 'clean'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    data: 'touched'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    data: 'changed'
                },
                {
                    mode: 'editing',
                    params: 'incomplete',
                    data: 'clean'
                },
                {
                    mode: 'editing',
                    params: 'incomplete',
                    data: 'touched'
                },
                {
                    mode: 'editing',
                    params: 'incomplete',
                    data: 'changed'
                },
                {
                    mode: 'fatal-error'
                }
            ]
        },
        {
            state: {
                mode: 'editing',
                params: 'incomplete',
                data: 'touched'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['save']
                },
                elements: {
                    show: ['parameters-group'],
                    hide: ['fatal-error']
                }
            },
            next: [                
                {
                    mode: 'editing',
                    params: 'incomplete',
                    data: 'clean'
                },
                {
                    mode: 'editing',
                    params: 'incomplete',
                    data: 'touched'
                },
                {
                    mode: 'editing',
                    params: 'incomplete',
                    data: 'changed'
                },
                {
                    mode: 'fatal-error'
                }
            ]
        },
        // In the incomplete changed state, the editor has no pending
        // changes (touched), the model has been updated,
        // but we can't save it yet because it is incomplete. 
        {
            state: {
                mode: 'editing',
                params: 'incomplete',
                data: 'changed'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['save']
                },
                elements: {
                    show: ['parameters-group'],
                    hide: ['fatal-error']
                }
            },
            next: [
                {
                    mode: 'editing',
                    params: 'incomplete',
                    data: 'touched'
                },
                {
                    mode: 'editing',
                    params: 'incomplete',
                    data: 'changed'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    data: 'clean'
                },
                {
                    mode: 'fatal-error'
                }
            ]
        },
        // the entry state for completed editor, yay!
        {
            state: {
                mode: 'editing',
                params: 'complete',
                data: 'clean'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['save']
                },
                elements: {
                    show: ['parameters-group'],
                    hide: ['fatal-error']
                }
            },
            next: [
                {
                    mode: 'editing',
                    params: 'incomplete',
                    data: 'changed'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    data: 'touched'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    data: 'changed'
                },
                {
                    mode: 'saving'
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
                mode: 'editing',
                params: 'complete',
                data: 'touched'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['save']
                },
                elements: {
                    show: ['parameters-group'],
                    hide: ['fatal-error']
                }
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    data: 'touched'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    data: 'changed'
                },
                {
                    mode: 'saving'
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
                mode: 'editing',
                params: 'complete',
                data: 'changed'
            },
            ui: {
                buttons: {
                    enabled: ['save'],
                    disabled: []
                },
                elements: {
                    show: ['parameters-group'],
                    hide: ['fatal-error']
                }
            },
            next: [
                // upon a save, the edit state will be clean
                {
                    mode: 'editing',
                    params: 'complete',
                    data: 'clean'
                },
                // continuing edits for a changed editor are still changed
                 {
                    mode: 'editing',
                    params: 'complete',
                    data: 'changed'
                },
                 {
                    mode: 'editing',
                    params: 'complete',
                    data: 'touched'
                },
                {
                    mode: 'saving'
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
                mode: 'error'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['save']
                },
                elements: {
                    show: [],
                    hide: ['parameters-group']
                }
            },
            next: [
                {
                    mode: 'error'
                },
                {
                    mode: 'editing',
                    params: 'complete'
                },
                {
                    mode: 'fatal-error'
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
                    disabled: [],
                    hide: ['save']
                },
                elements: {
                    show: ['fatal-error'],
                    hide: ['parameters-group', 'edit-object-selector', 'available-actions', 'editor-status']
                }
            },
            next: [
                {
                    mode: 'fatal-error'
                }
            ]

        }
    ];
    return {
        fsm: fsm
    };
});
