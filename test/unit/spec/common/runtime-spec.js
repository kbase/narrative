define(['common/runtime', 'base/js/namespace', 'narrativeConfig', 'testUtil'], (
    Runtime,
    Jupyter,
    Config,
    TestUtil
) => {
    'use strict';

    const runtimeKeys = ['bus', 'created', 'env'];
    const runtimeFunctions = [
        'authToken',
        'config',
        'bus',
        'getUserSetting',
        'getEnv',
        'setEnv',
        'workspaceId',
        'userId',
    ];
    const config = Config.getConfig();

    describe('Test Runtime module', () => {
        it('Should be loaded with the right functions', () => {
            expect(Runtime).toBeDefined();
            expect(Runtime).toEqual(jasmine.any(Object));
            expect(Runtime.make).toBeDefined();
            expect(Runtime.make).toEqual(jasmine.any(Function));
        });

        afterAll(() => TestUtil.clearRuntime());
    });

    describe('The runtime instance', () => {
        let runtime;
        beforeAll(() => {
            TestUtil.clearRuntime();
        });

        beforeEach(() => {
            runtime = Runtime.make();
        });

        afterEach(() => {
            runtime.destroy();
            TestUtil.clearRuntime();
            runtime = null;
        });

        it('has methods defined', () => {
            runtimeFunctions.forEach((fn) => {
                expect(runtime[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('adds "kbaseRuntime" to the window', () => {
            expect(window.kbaseRuntime).toBeDefined();
            runtimeKeys.forEach((key) => {
                expect(window.kbaseRuntime[key]).toBeDefined();
                expect(window.kbaseRuntime[key]).toEqual(jasmine.any(Object));
            });
            expect(runtime.bus()).toEqual(window.kbaseRuntime.bus);
            expect(window.kbaseRuntime.created).toBeInstanceOf(Date);
            // a bit of duck-typing, since we can't check the object type.
            const propsFunctions = [
                'setItem',
                'getItem',
                'getItem',
                'copyItem',
                'incrItem',
                'deleteItem',
                'pushItem',
                'popItem',
                'reset',
                'getRawObject',
                'getLastRawObject',
                'getHistoryCount',
            ];
            propsFunctions.forEach((fn) => {
                expect(window.kbaseRuntime.env[fn]).toBeDefined();
                expect(window.kbaseRuntime.env[fn]).toEqual(jasmine.any(Function));
            });
        });
    });

    describe('create_runtime', () => {
        beforeAll(() => {
            TestUtil.clearRuntime();
        });

        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('will reuse an existing runtime', () => {
            window.kbaseRuntime = 'invalid runtime data';
            // initialise a new runtime
            const runtime = Runtime.make();
            expect(window.kbaseRuntime).toBeDefined();
            // createRuntime doesn't check anything more than that window.kbaseRuntime is defined
            expect(window.kbaseRuntime).toEqual('invalid runtime data');
            expect(runtime).toEqual(jasmine.any(Object));
            runtimeFunctions.forEach((fn) => {
                expect(runtime[fn]).toEqual(jasmine.any(Function));
            });
            // can't execute functions that rely on window.kbaseRuntime.env.*
            const windowFunctions = ['getEnv', 'setEnv'];
            windowFunctions.forEach((fn) => {
                try {
                    const result = runtime[fn]();
                    fail(`runtime.${fn} executed successfully: ${result}`);
                } catch (err) {
                    expect(err).toBeInstanceOf(Error);
                }
            });
            // window.kbaseRuntime.bus is undefined
            expect(runtime.bus()).toBeUndefined();
        });
    });

    describe('setEnv and getEnv', () => {
        let runtime;
        beforeAll(() => {
            TestUtil.clearRuntime();
        });

        beforeEach(() => {
            runtime = Runtime.make();
        });

        afterEach(() => {
            runtime.destroy();
            TestUtil.clearRuntime();
        });

        it('should set and retrieve env vars using setEnv and getEnv', () => {
            expect(runtime.getEnv('this')).toBeUndefined();
            runtime.setEnv('this', 'that');
            expect(runtime.getEnv('this')).toEqual('that');
            expect(window.kbaseRuntime.env.getRawObject()).toEqual({ this: 'that' });
        });
    });

    describe('narrative-related functions', () => {
        let runtime;
        beforeAll(() => {
            TestUtil.clearRuntime();
        });
        beforeEach(() => {
            Jupyter.narrative = {
                userId: 'player_1',
                getAuthToken: () => {
                    return 'ready player one';
                },
            };
            runtime = Runtime.make();
        });
        afterEach(() => {
            Jupyter.narrative = null;
            runtime.destroy();
            TestUtil.clearRuntime();
        });

        it('should retrieve the user ID from the narrative', () => {
            expect(runtime.userId()).toEqual('player_1');
        });
        it('should retrieve the user auth token from the narrative', () => {
            expect(runtime.authToken()).toEqual('ready player one');
        });
    });

    describe('narrative config-related functions', () => {
        let runtime;

        beforeAll(() => {
            TestUtil.clearRuntime();
        });
        beforeEach(() => {
            runtime = Runtime.make();
        });
        afterEach(() => {
            runtime.destroy();
            TestUtil.clearRuntime();
        });

        it('should retrieve a value from the narrative config', () => {
            expect(runtime.config('environment')).toEqual(config.environment);
            expect(runtime.config('deploy.hostname')).toEqual(config.deploy.hostname);
        });
        it('should use the default if the value is not available', () => {
            expect(runtime.config('power_level', 'MAXIMUM!')).toEqual('MAXIMUM!');
        });
        it('should fetch the workspace ID', () => {
            expect(runtime.workspaceId()).toEqual(Config.get('workspaceId'));
        });
    });

    describe('get user settings', () => {
        let runtime;

        beforeAll(() => {
            TestUtil.clearRuntime();
        });

        beforeEach(() => {
            Jupyter.notebook = {
                metadata: {
                    kbase: {
                        userSettings: {
                            this: 'that',
                            the: undefined,
                        },
                    },
                },
            };
            runtime = Runtime.make();
        });

        afterEach(() => {
            runtime.destroy();
            TestUtil.clearRuntime();
            Jupyter.notebook = null;
        });

        it('should fetch values from the user settings', () => {
            expect(runtime.getUserSetting('this', 'thing')).toEqual('that');
            // using the default
            expect(runtime.getUserSetting('the', 'other')).toEqual('other');
            expect(runtime.getUserSetting('that')).toEqual(undefined);
            // delete the user settings
            Jupyter.notebook.metadata.kbase = {};
            expect(runtime.getUserSetting('this', 'thing')).toEqual('thing');
        });
    });

    describe('bus creation', () => {
        beforeEach(() => {
            TestUtil.clearRuntime();
        });

        it('should pass on arguments to the bus, strict mode', () => {
            const runtime = Runtime.make({ bus: { strict: true } });
            try {
                // in strict mode, a channel without a description will throw an error
                runtime.bus().makeChannel({});
                fail('bus was not in strict mode');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toMatch(/Channel description is required/);
            } finally {
                runtime.destroy();
            }
        });

        it('should pass on arguments to the bus, verbose', () => {
            const runtime = Runtime.make({ bus: { verbose: true } });

            // in verbose mode, a channel without a description will emit a warning
            spyOn(console, 'warn').and.callThrough();
            runtime.bus().makeChannel({});
            expect(console.warn).toHaveBeenCalledOnceWith(['Channel created without description']);
            runtime.destroy();
        });
    });
});
