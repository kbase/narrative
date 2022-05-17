define([
    'common/runtime',
    'widgets/appWidgets2/input/newObjectInput',
    'widgets/appWidgets2/validators/constants',
    'base/js/namespace',
    'narrativeMocks',
    'testUtil',
], (Runtime, NewObjectInput, Constants, Jupyter, Mocks, TestUtil) => {
    'use strict';

    const AUTH_TOKEN = 'fakeAuthToken',
        INPUT_SELECTOR = 'input[data-element="input"]',
        WSID = 777,
        DEFAULT_VALUE = 'a_default_value',
        required = false,
        wsObjName = 'SomeObject',
        wsObjType = 'SomeModule.SomeType',
        wsObjMapping = {
            1: [null],
            2: [
                [
                    1,
                    wsObjName,
                    wsObjType,
                    '2019-07-23T22:42:44+0000',
                    1,
                    'someuser',
                    2,
                    'someworkspace',
                    'somehash',
                    123,
                    null,
                ],
            ],
            3: [
                [
                    1,
                    wsObjName,
                    'SomeOtherModule.SomeOtherType',
                    '2019-07-23T22:42:44+0000',
                    1,
                    'someotheruser',
                    3,
                    'someotherworkspace',
                    'somehash',
                    123,
                    null,
                ],
            ],
        };

    function buildTestConfig(_required, _bus, initialValue) {
        return {
            bus: _bus,
            parameterSpec: {
                data: {
                    defaultValue: DEFAULT_VALUE,
                    nullValue: '',
                    constraints: {
                        required: _required,
                        defaultValue: DEFAULT_VALUE,
                        types: [wsObjType],
                    },
                },
            },
            initialValue,
            channelName: _bus.channelName,
            closeParameters: [],
            workspaceId: WSID,
        };
    }

    function checkValidValidationMessage(value, message, options = {}) {
        const standardMsg = {
            isValid: true,
            messageId: undefined,
            errorMessage: undefined,
            shortMessage: undefined,
            diagnosis: Constants.DIAGNOSIS.VALID,
            value,
            parsedValue: value,
        };
        expect(message).toEqual(Object.assign(standardMsg, options));
    }

    function mockGetObjectInfo(response) {
        if (!response) {
            response = [null];
        }
        Mocks.mockJsonRpc1Call({
            url: Runtime.make().config('services.workspace.url'),
            body: /(?=.*get_object_info_new)/,
            response,
        });
    }

    function setDefaultBusResponse(_bus) {
        _bus.respond({
            key: {
                type: 'get-parameters',
            },
            handle: () => {
                return {
                    p1: null,
                    p2: 'banana',
                    p3: 'bar2',
                };
            },
        });
    }

    fdescribe('New Object Input tests', () => {
        let bus, testConfig, runtime, container;

        beforeEach(() => {
            runtime = Runtime.make();
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                userId: 'test_user',
            };

            container = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'select input testing - ' + Math.random().toString(36).substring(2),
            });
            testConfig = buildTestConfig(required, bus);

            // mock workspace calls.
            jasmine.Ajax.install();
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            bus.stop();
            runtime.destroy();
            TestUtil.clearRuntime();
            Jupyter.narrative = null;
            container.remove();
        });

        it('should be defined', () => {
            expect(NewObjectInput).not.toBeNull();
        });

        it('should be instantiable', () => {
            const widget = NewObjectInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            expect(widget.start).toEqual(jasmine.any(Function));
        });

        it('Should start and stop a widget', async () => {
            setDefaultBusResponse(bus);
            mockGetObjectInfo();
            const widget = NewObjectInput.make(testConfig);
            await widget.start({ node: container });
            expect(container.querySelector('input')).toBeDefined();
            await widget.stop();
            expect(container.innerHTML).toBe('');
        });

        it('Should update value via bus', () => {
            // start with one value, change it, then reset.
            // check along the way.
            setDefaultBusResponse(bus);
            mockGetObjectInfo();
            const initialValue = 'some_starting_value';
            const newValue = 'some_other_value';
            const widgetConfig = buildTestConfig(required, bus, initialValue);
            widgetConfig.skipAutoValidate = true;
            bus.on('sync', () => {
                bus.emit('update', { value: 'foo' });
            });
            const widget = NewObjectInput.make(widgetConfig);
            return widget.start({ node: container }).then(() => {
                expect(container.querySelector(INPUT_SELECTOR).value).toBe(initialValue);
                return new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeTruthy();
                        const inputElem = container.querySelector(INPUT_SELECTOR);
                        expect(inputElem.value).toBe(newValue);
                        resolve();
                    });
                    bus.emit('update', { value: newValue });
                });
            });
        });

        it('Should validate on startup when configured', () => {
            setDefaultBusResponse(bus);
            mockGetObjectInfo();

            const initialValue = 'an_initial_value';
            const startupValidConfig = buildTestConfig(required, bus, initialValue);
            const widget = NewObjectInput.make(startupValidConfig);
            return new Promise((resolve) => {
                bus.on('validation', (message) => {
                    expect(container.querySelector(INPUT_SELECTOR).value).toBe(initialValue);
                    checkValidValidationMessage(initialValue, message);
                    resolve();
                });
                return widget.start({ node: container });
            });
        });

        it('Should reset to default string via bus message', () => {
            setDefaultBusResponse(bus);
            mockGetObjectInfo();
            const initialValue = 'an_initial_value';
            const startupValidConfig = buildTestConfig(required, bus, initialValue);
            const widget = NewObjectInput.make(startupValidConfig);

            let validatedInitValue = false,
                validatedDefaultValue = false;
            return new Promise((resolve, reject) => {
                bus.on('validation', (message) => {
                    const value = message.value;
                    expect(container.querySelector(INPUT_SELECTOR).value).toBe(value);
                    checkValidValidationMessage(value, message);

                    if (value === DEFAULT_VALUE) {
                        validatedDefaultValue = true;
                    } else if (value === initialValue) {
                        validatedInitValue = true;
                        bus.emit('reset-to-defaults');
                    } else {
                        reject(`got unexpected value: ${value}`);
                    }
                    if (validatedDefaultValue && validatedInitValue) {
                        resolve();
                    }
                });
                return widget.start({ node: container });
            });
        });

        it('Should reset to empty string via bus without default', () => {
            setDefaultBusResponse(bus);
            mockGetObjectInfo();
            const initialValue = 'an_initial_value';
            const startupValidConfig = buildTestConfig(required, bus, initialValue);
            delete startupValidConfig.parameterSpec.data.defaultValue;
            const widget = NewObjectInput.make(startupValidConfig);

            let validatedInitValue = false,
                validatedResetValue = false;
            return new Promise((resolve, reject) => {
                bus.on('validation', (message) => {
                    const value = message.value;
                    expect(container.querySelector(INPUT_SELECTOR).value).toBe(value);
                    if (value === '') {
                        validatedResetValue = true;
                        checkValidValidationMessage(value, message, {
                            diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                        });
                    } else if (value === initialValue) {
                        checkValidValidationMessage(value, message);
                        validatedInitValue = true;
                        bus.emit('reset-to-defaults');
                    } else {
                        reject(`got unexpected value: ${value}`);
                    }
                    if (validatedResetValue && validatedInitValue) {
                        resolve();
                    }
                });
                return widget.start({ node: container });
            });
        });

        it('Should respond to duplicate parameter change events with "validation"', () => {
            const inputStr = 'banana';
            const testConfig = buildTestConfig(false, bus, inputStr);
            const widget = NewObjectInput.make(testConfig);
            mockGetObjectInfo();
            bus.respond({
                key: {
                    type: 'get-parameters',
                },
                handle: () => {
                    return {
                        p1: null,
                        p2: 'banana',
                        p3: 'bar2',
                    };
                },
            });

            return new Promise((resolve) => {
                bus.on('validation', (message) => {
                    expect(message).toEqual({
                        isValid: false,
                        diagnosis: Constants.DIAGNOSIS.INVALID,
                        errorMessage:
                            'Every output object from a single app run must have a unique name.',
                    });
                    resolve();
                });
                return widget.start({ node: container });
            });
        });

        it('Should validate against workspace with non-unique parameter change events with "validation"', () => {
            const inputStr = wsObjName;
            const testConfig = buildTestConfig(false, bus, inputStr);
            const widget = NewObjectInput.make(testConfig);
            bus.respond({
                key: {
                    type: 'get-parameters',
                },
                handle: () => {
                    return {
                        p1: null,
                        p2: 'foo2',
                        p3: 'bar2',
                    };
                },
            });
            mockGetObjectInfo(wsObjMapping[2]);

            return new Promise((resolve) => {
                bus.on('validation', (message) => {
                    checkValidValidationMessage(inputStr, message, {
                        shortMessage: 'an object already exists with this name',
                        diagnosis: Constants.DIAGNOSIS.SUSPECT,
                        messageId: Constants.MESSAGE_IDS.OBJ_OVERWRITE_WARN,
                    });
                    resolve();
                });
                return widget.start({ node: container });
            });
        });

        ['change', 'keyup'].forEach((eventType) => {
            it('Should send "validation" and "changed" messages when the value changes', () => {
                setDefaultBusResponse(bus);
                mockGetObjectInfo();
                const changedStr = 'new_str';
                const testConfig = buildTestConfig(false, bus);
                testConfig.skipAutoValidate = true;
                const widget = NewObjectInput.make(testConfig);

                return new Promise((resolve) => {
                    let gotValidationMsg = false,
                        gotChangedMsg = false;
                    bus.on('validation', (message) => {
                        checkValidValidationMessage(changedStr, message);
                        gotValidationMsg = true;
                        if (gotValidationMsg && gotChangedMsg) {
                            resolve();
                        }
                    });

                    bus.on('changed', (message) => {
                        expect(message).toEqual({
                            newValue: changedStr,
                        });
                        gotChangedMsg = true;
                        if (gotValidationMsg && gotChangedMsg) {
                            resolve();
                        }
                    });
                    return widget.start({ node: container }).then(() => {
                        const inputElem = container.querySelector(INPUT_SELECTOR);
                        inputElem.value = changedStr;
                        inputElem.dispatchEvent(new Event(eventType));
                    });
                });
            });
        });
    });
});
