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
                    name: null,
                    user: 'some_user',
                })
            });
            jasmine.Ajax.stubRequest(/\/me$/).andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify({
                    display: 'Some User',
                    user: 'some_user',
                })
            });

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
                        callbacks.shell.reply({
                            content: {}
                        });
                    }
                },
                notebook_name: DEFAULT_NOTEBOOK_NAME
            };
            Jupyter.keyboard_manager = Jupyter.notebook.keyboard_manager;

            // The NarrativeLogin.init call invokes both of the above token/user profile calls.
            // It's called before the creation of the Narrative object. So that needs to happen here.
            await NarrativeLogin.init(loginDiv);
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            Jupyter.notebook = null;
        });

        it('Should instantiate', () => {
            const narr = new Narrative();
            expect(narr.maxNarrativeSize).toBe('10 MB');
        });

        it('Should have an init function that responds when the kernel is connected', () => {
            return new Promise((resolve, reject) => {
                const narr = new Narrative();
                const jobsReadyCallback = (err) => {
                    if (err) {
                        reject('This should not have failed', err);
                    }
                    else {
                        resolve();
                    }
                };
                narr.init(jobsReadyCallback);
                $([Jupyter.events]).trigger('kernel_connected.Kernel');
            });
        });

        it('init should fail as expected when the job connection fails', () => {
            return new Promise((resolve, reject) => {
                Jupyter.notebook.kernel.comm_info = () => {
                    throw new Error('an error happened');
                };
                const narr = new Narrative();
                const jobsReadyCallback = (err) => {
                    if (err) {
                        resolve();
                    }
                    else {
                        reject('expected an error');
                    }
                };
                narr.init(jobsReadyCallback);
                $([Jupyter.events]).trigger('kernel_connected.Kernel');
            });
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
