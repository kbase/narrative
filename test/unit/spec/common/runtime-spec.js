define(['common/runtime', 'base/js/namespace', 'narrativeConfig'], (Runtime, Jupyter, Config) => {
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
    });

    describe('The runtime instance', () => {
        beforeAll(() => {
            window.kbaseRuntime = null;
        });

        beforeEach(function () {
            this.runtime = Runtime.make();
        });

        afterEach(() => {
            window.kbaseRuntime = null;
        });

        it('has methods defined', function () {
            runtimeFunctions.forEach((fn) => {
                expect(this.runtime[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('adds "kbaseRuntime" to the window', function () {
            expect(window.kbaseRuntime).toBeDefined();
            runtimeKeys.forEach((key) => {
                expect(window.kbaseRuntime[key]).toBeDefined();
                expect(window.kbaseRuntime[key]).toEqual(jasmine.any(Object));
            });
            expect(this.runtime.bus()).toEqual(window.kbaseRuntime.bus);
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
            window.kbaseRuntime = null;
        });

        afterEach(() => {
            window.kbaseRuntime = null;
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
        beforeAll(() => {
            window.kbaseRuntime = null;
        });

        beforeEach(function () {
            this.runtime = Runtime.make();
        });
        afterEach(() => {
            window.kbaseRuntime = null;
        });

        it('should set and retrieve env vars using setEnv and getEnv', function () {
            expect(this.runtime.getEnv('this')).toBeUndefined();
            this.runtime.setEnv('this', 'that');
            expect(this.runtime.getEnv('this')).toEqual('that');
            expect(window.kbaseRuntime.env.getRawObject()).toEqual({ this: 'that' });
        });
    });

    describe('narrative-related functions', () => {
        beforeAll(() => {
            window.kbaseRuntime = null;
        });
        beforeEach(function () {
            Jupyter.narrative = {
                userId: 'player_1',
                getAuthToken: () => {
                    return 'ready player one';
                },
            };
            this.runtime = Runtime.make();
        });
        afterEach(() => {
            Jupyter.narrative = null;
            window.kbaseRuntime = null;
        });

        it('should retrieve the user ID from the narrative', function () {
            expect(this.runtime.userId()).toEqual('player_1');
        });
        it('should retrieve the user auth token from the narrative', function () {
            expect(this.runtime.authToken()).toEqual('ready player one');
        });
    });

    describe('narrative config-related functions', () => {
        beforeAll(() => {
            window.kbaseRuntime = null;
        });
        beforeEach(function () {
            this.runtime = Runtime.make();
        });
        afterEach(() => {
            window.kbaseRuntime = null;
        });

        it('should retrieve a value from the narrative config', function () {
            expect(this.runtime.config('environment')).toEqual(config.environment);
            expect(this.runtime.config('deploy.hostname')).toEqual(config.deploy.hostname);
        });
        it('should use the default if the value is not available', function () {
            expect(this.runtime.config('power_level', 'MAXIMUM!')).toEqual('MAXIMUM!');
        });
        it('should fetch the workspace ID', function () {
            expect(this.runtime.workspaceId()).toEqual(Config.get('workspaceId'));
        });
    });

    describe('get user settings', () => {
        beforeAll(() => {
            window.kbaseRuntime = null;
        });
        beforeEach(function () {
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
            this.runtime = Runtime.make();
        });
        afterEach(() => {
            window.kbaseRuntime = null;
            Jupyter.notebook = null;
        });
        it('should fetch values from the user settings', function () {
            expect(this.runtime.getUserSetting('this', 'thing')).toEqual('that');
            // using the default
            expect(this.runtime.getUserSetting('the', 'other')).toEqual('other');
            expect(this.runtime.getUserSetting('that')).toEqual(undefined);
            // delete the user settings
            Jupyter.notebook.metadata.kbase = {};
            expect(this.runtime.getUserSetting('this', 'thing')).toEqual('thing');
        });
    });

    describe('bus creation', () => {
        let runtime;
        beforeAll(() => {
            window.kbaseRuntime = null;
        });
        afterEach(() => {
            runtime.destroy();
            window.kbaseRuntime = null;
        });

        it('should pass on arguments to the bus, strict mode', () => {
            runtime = Runtime.make({ bus: { strict: true } });
            try {
                // in strict mode, a channel without a description will throw an error
                runtime.bus().makeChannel({});
                fail('bus was not in strict mode');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toMatch(/Channel description is required/);
            }
        });

        it('should pass on arguments to the bus, verbose', () => {
            runtime = Runtime.make({ bus: { verbose: true } });

            // in verbose mode, a channel without a description will emit a warning
            spyOn(console, 'warn').and.callThrough();
            runtime.bus().makeChannel({});
            expect(console.warn).toHaveBeenCalledOnceWith(['Channel created without description']);
        });
    });
});