define([
    'bluebird',
    'jquery',
    'narrativeConfig',
    'kbaseNarrative',
    'base/js/namespace',
    'narrativeLogin',
    'narrativeMocks',
], (Promise, $, Config, Narrative, Jupyter, NarrativeLogin, Mocks) => {
    'use strict';

    const DEFAULT_FULLY_LOADED = false,
        DEFAULT_WRITABLE = false,
        DEFAULT_NOTEBOOK_NAME = 'some notebook',
        TEST_TOKEN = 'foo',
        TEST_USER = 'some_user';

    describe('Test the kbaseNarrative module', () => {
        const loginDiv = $('<div>');

        beforeAll(() => {
            // remove any jquery events that get bound to document,
            // including login and logout listeners
            $(document).off();
        })

        beforeEach(async () => {
            // we need to be "logged in" for various tests to work, especially initing the Narrative object.
            // this means mocking up some auth responses, and the NarrativeLogin object.
            Mocks.setAuthToken(TEST_TOKEN);
            jasmine.Ajax.install();
            Mocks.mockAuthRequest(
                'token',
                {
                    expires: Date.now() + 10 * 60 * 60 * 24 * 1000,
                    created: Date.now(),
                    name: 'some_token',
                    id: 'some_uuid',
                    type: 'Login',
                    user: TEST_USER,
                    cachefor: 500000,
                },
                200
            );
            Mocks.mockAuthRequest(
                'me',
                {
                    display: 'Some User',
                    user: TEST_USER,
                    email: `${TEST_USER}@kbase.us`,
                },
                200
            );
            Mocks.mockJsonRpc1Call({
                url: Config.url('user_profile'),
                response: [{}],
            });

            // mock a jupyter notebook.
            // namespace should already be loaded
            Jupyter.notebook = {
                _fully_loaded: DEFAULT_FULLY_LOADED,
                writable: DEFAULT_WRITABLE,
                keyboard_manager: {
                    edit_shortcuts: {
                        remove_shortcut: () => {},
                    },
                    command_shortcuts: {
                        remove_shortcut: () => {},
                    },
                },
                kernel: {
                    is_connected: () => false,
                    comm_info: (comm_name, callback) => {
                        callback({
                            content: {
                                comms: {
                                    some_comm_id: {
                                        target_name: 'KBaseJobs',
                                    },
                                },
                            },
                        });
                    },
                    comm_manager: {
                        register_comm: () => {},
                    },
                    execute: (code, callbacks) => {
                        callbacks.shell.reply({
                            content: {},
                        });
                    },
                },
                notebook_name: DEFAULT_NOTEBOOK_NAME,
            };
            Jupyter.keyboard_manager = Jupyter.notebook.keyboard_manager;

            // The NarrativeLogin.init call invokes both of the above token/user profile calls.
            // It's called before the creation of the Narrative object. So that needs to happen here.
            await NarrativeLogin.init(loginDiv);
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            Jupyter.notebook = null;
            NarrativeLogin.clearTokenCheckTimers();
            NarrativeLogin.destroy();
            Mocks.clearAuthToken();
            // clear all jquery event listeners set up by either NarrativeLogin or anything else
            $(document).off();
            $([Jupyter.events]).off();
            document.body.innerHTML = '';
        });

        it('Should instantiate', () => {
            const narr = new Narrative();
            expect(narr.maxNarrativeSize).toBe('10 MB');
        });

        it('Should have an init function that responds when the kernel is connected', (done) => {
            return Promise.try(() => {
                const narr = new Narrative();
                const jobsReadyCallback = (err) => {
                    expect(err).toBeFalsy();
                    done();
                };
                narr.init(jobsReadyCallback);
                $([Jupyter.events]).trigger('kernel_connected.Kernel');
                // return new Promise((resolve) => setTimeout(resolve, 500));
            });
        });

        it('init should fail as expected when the job connection fails', (done) => {
            return Promise.try(() => {
                Jupyter.notebook.kernel.comm_info = () => {
                    throw new Error('an error happened');
                };
                const narr = new Narrative();
                const jobsReadyCallback = (err) => {
                    expect(err).toBeDefined();
                    done();
                };
                narr.init(jobsReadyCallback);
                $([Jupyter.events]).trigger('kernel_connected.Kernel');
                // return new Promise((resolve) => setTimeout(resolve, 500));

            });
        });

        it('Should return a boolean for is_loaded', () => {
            const narr = new Narrative();
            // default as set in the mock Jupyter object above
            expect(narr.isLoaded()).toEqual(DEFAULT_FULLY_LOADED);
        });

        it('Should test ui mode', () => {
            const narr = new Narrative();
            expect(Jupyter.notebook.writable).toBe(DEFAULT_WRITABLE);
            expect(narr.uiModeIs('edit')).toBe(DEFAULT_WRITABLE);
            expect(narr.uiModeIs('view')).toBe(!DEFAULT_WRITABLE);
            Jupyter.notebook.writable = !Jupyter.notebook.writable;
            expect(narr.uiModeIs('edit')).toBe(!DEFAULT_WRITABLE);
            expect(narr.uiModeIs('view')).toBe(DEFAULT_WRITABLE);
        });

        it('Should provide an auth token when requested', () => {
            const narr = new Narrative();
            expect(narr.getAuthToken()).toBe(TEST_TOKEN);
        });
    });
});
