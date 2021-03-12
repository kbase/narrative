define(['common/runtime', 'widgets/appWidgets2/input/textInput'], (Runtime, TextInput) => {
    'use strict';
    let bus, testConfig, node;
    const required = false,
        defaultValue = 'some test text';

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
                    },
                },
            },
            channelName: _bus.channelName,
        };
    }

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    describe('Text Input tests', () => {
        beforeEach(() => {
            const runtime = Runtime.make();
            node = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'text input testing',
            });
            testConfig = buildTestConfig(required, defaultValue, bus);
        });

        afterEach(() => {
            bus.stop();
            window.kbaseRuntime = null;
        });

        it('should be defined', () => {
            expect(TextInput).not.toBeNull();
        });

        it('should be instantiable', () => {
            const widget = TextInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('Should start and stop a widget', (done) => {
            const widget = TextInput.make(testConfig);

            widget
                .start({ node: node })
                .then(() => {
                    // verify it's there.
                    const inputElem = node.querySelector('input[data-element="input"]');
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
            // start with one value, change it, then reset.
            // check along the way.
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                done();
            });
            const widget = TextInput.make(testConfig);
            widget.start({ node: node }).then(() => {
                bus.emit('update', { value: 'some text' });
            });
        });

        it('Should reset to default via bus', (done) => {
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                done();
            });
            const widget = TextInput.make(testConfig);
            widget.start({ node: node }).then(() => {
                bus.emit('reset-to-defaults');
            });
        });

        it('Should respond to input change events with "changed"', (done) => {
            const widget = TextInput.make(testConfig);
            const inputText = 'here is some text';
            bus.on('changed', (message) => {
                expect(message.newValue).toEqual(inputText);
                done();
            });
            widget.start({ node: node }).then(() => {
                const inputElem = node.querySelector('input[data-element="input"]');
                inputElem.value = inputText;
                inputElem.dispatchEvent(new Event('change'));
            });
        });

        it('Should respond to input change events with "validation"', (done) => {
            const widget = TextInput.make(testConfig);
            const inputText = 'here is some text';
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                expect(message.errorMessage).toBeUndefined();
                done();
            });
            widget.start({ node: node }).then(() => {
                const inputElem = node.querySelector('input[data-element="input"]');
                inputElem.value = inputText;
                inputElem.dispatchEvent(new Event('change'));
            });
        });

        xit('Should respond to keyup change events with "validation"', (done) => {
            const widget = TextInput.make(testConfig);
            const inputText = 'here is some text';
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                expect(message.errorMessage).toBeUndefined();
                done();
            });
            widget.start({ node: node }).then(() => {
                const inputElem = node.querySelector('input[data-element="input"]');
                inputElem.value = inputText;
                inputElem.dispatchEvent(new Event('keyup'));
            });
        });

        it('Should show message when configured', (done) => {
            testConfig.showOwnMessages = true;
            const widget = TextInput.make(testConfig);
            const inputText = 'some text';
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                // ...detect something?
                done();
            });
            widget.start({ node: node }).then(() => {
                const inputElem = node.querySelector('input[data-element="input"]');
                inputElem.value = inputText;
                inputElem.dispatchEvent(new Event('change'));
            });
        });

        it('Should return a diagnosis of required-missing if so', (done) => {
            testConfig = buildTestConfig(true, '', bus);
            const widget = TextInput.make(testConfig);
            const inputText = null;
            bus.on('validation', (message) => {
                expect(message.isValid).toBeFalsy();
                expect(message.diagnosis).toBe('required-missing');
                // ...detect something?
                done();
            });
            widget.start({ node: node }).then(() => {
                const inputElem = node.querySelector('input[data-element="input"]');
                inputElem.value = inputText;
                inputElem.dispatchEvent(new Event('change'));
            });
        });
    });
});
