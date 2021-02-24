define(['common/runtime', 'widgets/appWidgets2/input/selectInput'], (Runtime, SelectInput) => {
    'use strict';
    let bus,
        testConfig,
        required = false,
        runtime,
        node,
        defaultValue = 'apple';

    function buildTestConfig(required, defaultValue, bus) {
        return {
            bus: bus,
            parameterSpec: {
                data: {
                    defaultValue: defaultValue,
                    nullValue: '',
                    constraints: {
                        required: required,
                        defaultValue: defaultValue,
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
            channelName: bus.channelName,
            initialValue: 'apple',
        };
    }

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    describe('Select Input tests', () => {
        beforeEach(() => {
            runtime = Runtime.make();
            node = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'select input testing',
            });
            testConfig = buildTestConfig(required, defaultValue, bus);
        });

        afterEach(() => {
            bus.stop();
            window.kbaseRuntime = null;
        });

        it('Should load the widget', () => {
            expect(SelectInput).not.toBeNull();
        });

        it('Should start and stop a widget', (done) => {
            const widget = SelectInput.make(testConfig);
            expect(widget).toBeDefined();
            expect(widget.start).toBeDefined();

            widget
                .start({ node: node })
                .then(() => {
                    // verify it's there.
                    const inputElem = node.querySelector('select[data-element="input"]');
                    expect(inputElem).toBeDefined();
                    return widget.stop();
                })
                .then(() => {
                    // verify it's gone.
                    expect(node.childElementCount).toBe(0);
                    done();
                });
        });

        it('Should update value via bus', (done) => {
            //and reset model properly via bus', (done) => {
            // start with one value, change it, then reset.
            // check along the way.
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                done();
            });
            const widget = SelectInput.make(testConfig);
            widget.start({ node: node }).then(() => {
                bus.emit('update', { value: 'banana' });
            });
        });

        it('Should reset to default via bus', (done) => {
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                done();
            });
            const widget = SelectInput.make(testConfig);
            widget.start({ node: node }).then(() => {
                bus.emit('reset-to-defaults');
            });
        });

        it('Should respond to input change events with "changed"', (done) => {
            const widget = SelectInput.make(testConfig);
            bus.on('changed', (message) => {
                expect(message.newValue).toEqual('banana');
                done();
            });
            widget.start({ node: node }).then(() => {
                const inputElem = node.querySelector('select[data-element="input"]');
                inputElem.selectedIndex = 2;
                inputElem.dispatchEvent(new Event('change'));
            });
        });

        it('Should respond to input change events with "validation"', (done) => {
            const widget = SelectInput.make(testConfig);
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                expect(message.errorMessage).toBeUndefined();
                done();
            });
            widget.start({ node: node }).then(() => {
                const inputElem = node.querySelector('select[data-element="input"]');
                inputElem.selectedIndex = 1;
                inputElem.dispatchEvent(new Event('change'));
            });
        });

        it('Should show message when configured', (done) => {
            testConfig.showOwnMessages = true;
            const widget = SelectInput.make(testConfig);
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                // ...detect something?
                done();
            });
            widget.start({ node: node }).then(() => {
                const inputElem = node.querySelector('select[data-element="input"]');
                inputElem.value = 'banana';
                inputElem.dispatchEvent(new Event('change'));
            });
        });

        it('Should return a diagnosis of required-missing if so', (done, fail) => {
            bus = runtime.bus().makeChannelBus();
            testConfig = buildTestConfig(true, '', bus);
            const widget = SelectInput.make(testConfig);
            const inputText = null;
            let msgCount = 0,
                okCount = 0;
            bus.on('validation', (message) => {
                msgCount++;
                if (message.isValid) {
                    okCount++;
                }
                if (msgCount === 2) {
                    if (okCount > 1) {
                        fail('too many ok messages');
                    }
                }
                if (!message.isValid) {
                    expect(message.diagnosis).toBe('required-missing');
                    done();
                }
            });
            widget.start({ node: node }).then(() => {
                const inputElem = node.querySelector('select[data-element="input"]');
                inputElem.selectedIndex = -1;
                inputElem.dispatchEvent(new Event('change'));
            });
        });
    });
});
