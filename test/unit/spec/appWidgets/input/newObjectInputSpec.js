define([
    'common/runtime',
    'widgets/appWidgets2/input/newObjectInput',
    'base/js/namespace',
    'narrativeMocks',
], (Runtime, NewObjectInput, Jupyter, Mocks) => {
    'use strict';
    let bus, testConfig, runtime, node;
    const AUTH_TOKEN = 'fakeAuthToken',
        required = false,
        defaultValue = 'apple',
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

    function buildTestConfig(_required, _defaultValue, _bus) {
        return {
            bus: _bus,
            parameterSpec: {
                data: {
                    defaultValue: _defaultValue,
                    nullValue: '',
                    constraints: {
                        required: _required,
                        defaultValue: _defaultValue,
                        types: ['SomeModule.SomeType'],
                    },
                },
            },
            channelName: _bus.channelName,
            closeParameters: [],
            workspaceId: 777,
        };
    }

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    describe('New Object Input tests', () => {
        beforeEach(() => {
            runtime = Runtime.make();
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                userId: 'test_user',
            };

            node = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'select input testing - ' + Math.random().toString(36).substring(2),
            });
            testConfig = buildTestConfig(required, defaultValue, bus);

            // mock workspace calls.
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(
                runtime.config('services.workspace.url'),
                /wsid.\s*:\s*777\s*,/
            ).andReturn(
                (function () {
                    return {
                        status: 200,
                        statusText: 'HTTP/1.1 200 OK',
                        contentType: 'application/json',
                        responseText: JSON.stringify({ result: [wsObjMapping['2']] }),
                    };
                })()
            );
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            bus.stop();
            window.kbaseRuntime = null;
            Jupyter.narrative = null;
        });

        it('should be defined', () => {
            expect(NewObjectInput).not.toBeNull();
        });

        it('should be instantiable', () => {
            const widget = NewObjectInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            expect(widget.start).toEqual(jasmine.any(Function));
        });

        it('Should start a widget', (done) => {
            const widget = NewObjectInput.make(testConfig);

            bus.on('sync', () => {
                const inputElem = node.querySelector('input');
                expect(inputElem).toBeDefined();
                done();
            });
            widget.start().then(() => {
                bus.emit('run', { node: node });
            });
        });

        it('Should update value via bus', (done) => {
            // start with one value, change it, then reset.
            // check along the way.
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

            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                const inputElem = node.querySelector('input[data-element="input"]');
                if (inputElem) {
                    expect(inputElem.value).toBe('foo');
                    done();
                }
            });

            bus.on('sync', () => {
                bus.emit('update', { value: 'foo' });
            });
            const widget = NewObjectInput.make(testConfig);
            widget.start().then(() => {
                bus.emit('run', { node: node });
            });
        });

        it('Should reset to default via bus', (done) => {
            let validationCount = 0;

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

            bus.on('validation', () => {
                const inputElem = node.querySelector('input[data-element="input"]');
                if (inputElem) {
                    if (validationCount < 1) {
                        expect(inputElem.value).toBe('foobarbaz');
                        validationCount++;
                        bus.emit('reset-to-defaults');
                    } else {
                        expect(inputElem.value).toBe('apple');
                        done();
                    }
                }
            });
            bus.on('sync', () => {
                bus.emit('update', { value: 'foobarbaz' });
            });

            const widget = NewObjectInput.make(testConfig);
            widget.start().then(() => {
                bus.emit('run', { node: node });
            });
        });

        it('Should reset to empty string via bus without default', (done) => {
            testConfig = buildTestConfig(false, undefined, bus);
            let validationCount = 0;
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

            bus.on('validation', () => {
                const inputElem = node.querySelector('input[data-element="input"]');
                if (inputElem) {
                    if (validationCount < 1) {
                        expect(inputElem.value).toBe('foobarbaz');
                        validationCount++;
                        bus.emit('reset-to-defaults');
                    } else {
                        expect(inputElem.value).toBe('');
                        done();
                    }
                }
            });

            bus.on('sync', () => {
                bus.emit('update', { value: 'foobarbaz' });
            });
            const widget = NewObjectInput.make(testConfig);
            widget.start().then(() => {
                bus.emit('run', { node: node });
            });
        });

        it('Should respond to duplicate parameter change events with "validation"', (done) => {
            const widget = NewObjectInput.make(testConfig);
            const inputStr = 'banana';
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

            bus.on('validation', (message) => {
                expect(message.isValid).toBeFalsy();
                expect(message.diagnosis).toBe('invalid');
                expect(message.errorMessage).toContain('must have a unique name');
                done();
            });
            bus.on('sync', () => {
                bus.emit('update', { value: inputStr });
                // TestUtil.wait(500)
                //     .then(() => {
                //         let inputElem = node.querySelector('input[data-element="input"]');
                //         inputElem.dispatchEvent(new Event('change'));
                //     });
            });
            widget.start().then(() => {
                bus.emit('run', { node: node });
            });
        });

        it('Should respond to non-unique parameter change events with "validation"', (done) => {
            const widget = NewObjectInput.make(testConfig);
            const inputStr = 'banana';
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

            bus.on('validation', () => {
                const inputElem = node.querySelector('input[data-element="input"]');
                if (inputElem) {
                    inputElem.dispatchEvent(new Event('change'));
                }
            });
            bus.on('sync', () => {
                bus.emit('update', { value: inputStr });
            });
            bus.on('changed', (message) => {
                expect(message.newValue).toBe('banana');
                done();
            });
            widget.start().then(() => {
                bus.emit('run', { node: node });
            });
        });

        it('Should validate against workspace with non-unique parameter change events with "validation"', (done) => {
            const widget = NewObjectInput.make(testConfig);
            const inputStr = wsObjName;
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

            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                expect(message.shortMessage).toBe('an object already exists with this name');
                expect(message.diagnosis).toBe('suspect');
                done();
            });
            bus.on('sync', () => {
                bus.emit('update', { value: inputStr });
                // TestUtil.wait(500)
                //     .then(() => {
                //         let inputElem = node.querySelector('input[data-element="input"]');
                //         inputElem.dispatchEvent(new Event('change'));
                //     });
            });
            widget.start().then(() => {
                bus.emit('run', { node: node });
            });
        });
    });
});
