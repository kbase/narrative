define(['common/runtime', 'widgets/appWidgets2/input/selectInput'], (Runtime, SelectInput) => {
    'use strict';
    let bus, testConfig, runtime, container;
    const required = false,
        defaultValue = 'apple';

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
                        options: [
                            {
                                value: 'apple',
                                display: 'Apple',
                            },
                            {
                                value: 'banana',
                                display: 'Banana',
                            },
                            {
                                value: 'carrot',
                                display: 'Carrot',
                            },
                        ],
                    },
                },
            },
            channelName: _bus.channelName,
            initialValue: 'apple',
        };
    }

    describe('Select Input tests', () => {
        beforeEach(() => {
            runtime = Runtime.make();
            container = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'select input testing',
            });
            testConfig = buildTestConfig(required, defaultValue, bus);
        });

        afterEach(() => {
            bus.stop();
            window.kbaseRuntime = null;
            container.remove();
        });

        it('should be defined', () => {
            expect(SelectInput).not.toBeNull();
        });

        it('should be instantiable', () => {
            const widget = SelectInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('Should start and stop a widget', () => {
            const widget = SelectInput.make(testConfig);

            return widget
                .start({ node: container })
                .then(() => {
                    // verify it's there.
                    const inputElem = container.querySelector('select[data-element="input"]');
                    expect(inputElem).toBeDefined();
                    return widget.stop();
                })
                .then(() => {
                    // verify it's gone.
                    expect(container.childElementCount).toBe(0);
                });
        });

        it('Should update value via bus', () => {
            //and reset model properly via bus', (done) => {
            // start with one value, change it, then reset.
            // check along the way.
            const widget = SelectInput.make(testConfig);
            return widget.start({ node: container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeTruthy();
                        resolve();
                    });
                    bus.emit('update', { value: 'banana' });
                });
            });
        });

        it('Should reset to default via bus', () => {
            const widget = SelectInput.make(testConfig);
            return widget.start({ node: container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeTruthy();
                        resolve();
                    });
                    bus.emit('reset-to-defaults');
                });
            });
        });

        it('Should respond to input change events with "changed"', () => {
            const widget = SelectInput.make(testConfig);
            return widget.start({ node: container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('changed', (message) => {
                        expect(message.newValue).toEqual('banana');
                        resolve();
                    });
                    const inputElem = container.querySelector('select[data-element="input"]');
                    inputElem.selectedIndex = 1;
                    inputElem.dispatchEvent(new Event('change'));
                });
            });
        });

        it('Should respond to input change events with "validation"', () => {
            const widget = SelectInput.make(testConfig);
            return widget.start({ node: container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeTruthy();
                        expect(message.errorMessage).toBeUndefined();
                        resolve();
                    });
                    const inputElem = container.querySelector('select[data-element="input"]');
                    inputElem.selectedIndex = 1;
                    inputElem.dispatchEvent(new Event('change'));
                });
            });
        });

        it('Should show message when configured', () => {
            testConfig.showOwnMessages = true;
            const widget = SelectInput.make(testConfig);
            return widget.start({ node: container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeTruthy();
                        // ...detect something?
                        resolve();
                    });
                    const inputElem = container.querySelector('select[data-element="input"]');
                    inputElem.selectedIndex = 1;
                    inputElem.dispatchEvent(new Event('change'));
                });
            });
        });

        it('Should return a diagnosis of required-missing if so', () => {
            bus = runtime.bus().makeChannelBus();
            testConfig = buildTestConfig(true, '', bus);
            const widget = SelectInput.make(testConfig);
            return widget.start({ node: container }).then(() => {
                return new Promise((resolve, reject) => {
                    let msgCount = 0,
                        okCount = 0;
                    bus.on('validation', (message) => {
                        msgCount++;
                        if (message.isValid) {
                            okCount++;
                        }
                        if (msgCount === 2) {
                            if (okCount > 1) {
                                reject('too many ok messages');
                            }
                        }
                        if (!message.isValid) {
                            expect(message.diagnosis).toBe('required-missing');
                            resolve();
                        }
                    });
                    const inputElem = container.querySelector('select[data-element="input"]');
                    inputElem.selectedIndex = -1;
                    inputElem.dispatchEvent(new Event('change'));
                });
            });
        });
    });
});
