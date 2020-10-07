/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach, beforeAll*/
/*jslint white: true*/

define ([
    'jquery',
    'narrativeConfig',
    'kbaseNarrative',
    'base/js/namespace',
    'narrativeLogin'
], (
    $,
    Config,
    Narrative,
    Jupyter,
    NarrativeLogin
) => {
    'use strict';

    const DEFAULT_FULLY_LOADED = false,
        DEFAULT_WRITABLE = false,
        DEFAULT_NOTEBOOK_NAME = 'some notebook',
        FAKE_TOKEN = 'foo';

    describe('Test the kbaseNarrative module', () => {
        let loginDiv = $('<div>');
        beforeAll(() => {
            // mock a jupyter notebook.
            // namespace should already be loaded
            Jupyter.notebook = {
                _fully_loaded: DEFAULT_FULLY_LOADED,
                writable: DEFAULT_WRITABLE,
                keyboard_manager: {
                    edit_shortcuts: {
                        remove_shortcut: () => {}
                    },
                    command_shortcuts: {
                        remove_shortcut: () => {}
                    }
                },
                kernel: {
                    is_connected: () => false,
                    comm_info: (comm_name, callback) => {
                        callback({content: {
                            comms: {
                                'some_comm_id': {
                                    target_name: 'KBaseJobs'
                                }
                            }
                        }});
                    },
                    comm_manager: {
                        register_comm: () => {}
                    },
                    execute: (code, callbacks) => {
                        console.log(code);
                        callbacks.shell.reply({
                            content: {}
                        });
                    }
                },
                notebook_name: DEFAULT_NOTEBOOK_NAME
            };
            Jupyter.keyboard_manager = Jupyter.notebook.keyboard_manager;
        });

        beforeEach(async () => {
            // we need to be "logged in" for various tests to work, especially initing the Narrative object.
            // this means mocking up some auth responses, and the NarrativeLogin object.
            document.cookie='kbase_session=' + FAKE_TOKEN;
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(/\/token$/).andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify({
                    type: 'Login',
                    id: 'some-token-id',
                    expires: 16027145808440,
                    created: 1601504980844,
                    name: null,
                    user: 'some_user',
                    custom: {},
                    cachefor: 300000
                })
            });
            jasmine.Ajax.stubRequest(/\/me$/).andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify({
                    created: 1490219221579,
                    lastlogin: 1601504980844,
                    display: 'Some User',
                    roles:[
                        {id: 'DevToken', desc: 'Create developer tokens'},
                        {id: 'ServToken', desc: 'Create server tokens'}
                    ],
                    customroles:['role1', 'role2'],
                    policyids:[
                        {id: 'data-policy.1', agreedon: 1497637084128},
                        {id: 'data-policy.3', agreedon: 1490285343224},
                        {id: 'kbase-user.1', agreedon: 1497637084130},
                        {id: 'kbase-user.2', agreedon: 1490285343222}
                    ],
                    user: 'some_user',
                    local: false,
                    email: 'some_user@somewhere.com',
                    idents:[
                        {provusername: 'some_user@somewhere.org', provider:'Globus', id: 'some-globus-ident-id'},
                        {provusername: '1234-5678-9012-3456', provider:'OrcID', id: 'some-orcid-ident-id'}
                    ]
                })
            });
            // The NarrativeLogin.init call invokes both of the above token/user profile calls.
            // It's called before the creation of the Narrative object. So that needs to happen here.
            await NarrativeLogin.init(loginDiv);
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        it('Should instantiate', () => {
            const narr = new Narrative();
            expect(narr.maxNarrativeSize).toBe('10 MB');
        });

        it('Should have an init function that responds when the kernel is connected', (done, fail) => {
            const narr = new Narrative();
            const jobsReadyCallback = (err) => {
                if (err) {
                    fail(err);
                }
                done();
            };
            narr.init(jobsReadyCallback);
            $([Jupyter.events]).trigger('kernel_connected.Kernel');
        });

        it('init should fail as expected when the job connection fails', (done, fail) => {

        });

        it('Should return a boolean for is_loaded', () => {
            const narr = new Narrative();
            expect(narr.isLoaded()).toEqual(DEFAULT_FULLY_LOADED);  // default as set in
        });

        it('Should test ui mode', () => {
            const narr = new Narrative();
            expect(narr.uiModeIs('edit')).toBe(DEFAULT_WRITABLE);
            expect(narr.uiModeIs('view')).toBe(!DEFAULT_WRITABLE);
            Jupyter.notebook.writable = !Jupyter.notebook.writable;
            expect(narr.uiModeIs('edit')).toBe(!DEFAULT_WRITABLE);
            expect(narr.uiModeIs('view')).toBe(DEFAULT_WRITABLE);
        });

        it('Should provide an auth token when requested', () => {
            const narr = new Narrative();
            expect(narr.getAuthToken()).toBe(FAKE_TOKEN);
        });

    });
});
