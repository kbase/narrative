define(['common/runtime', 'widgets/appWidgets2/input/textareaInput'], (Runtime, TextareaInput) => {
    'use strict';
    let bus,
        testConfig,
        required = false,
        runtime,
        node,
        defaultValue = 'some test text',
        numRows = 3;

    function buildTestConfig(required, defaultValue, bus) {
        return {
            bus: bus,
            parameterSpec: {
                data: {
                    defaultValue: defaultValue,
                    nullValue: null,
                    constraints: {
                        required: required,
                        defaultValue: defaultValue,
                    },
                },
                ui: {
                    nRows: numRows,
                },
            },
            channelName: bus.channelName,
        };
    }

    describe('Textarea Input tests', () => {
        beforeEach(() => {
            runtime = Runtime.make();
            node = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'textarea testing',
            });
            testConfig = buildTestConfig(required, defaultValue, bus);
        });

        it('Should load the widget', () => {
            expect(TextareaInput).not.toBeNull();
        });

        it('Should start and stop a widget', (done) => {
            let widget = TextareaInput.make(testConfig);
            expect(widget).toBeDefined();
            expect(widget.start).toBeDefined();

            widget
                .start({ node: node })
                .then(() => {
                    // verify it's there.
                    let textarea = node.querySelector('textarea');
                    expect(textarea).toBeDefined();
                    expect(textarea.getAttribute('rows')).toBe(String(numRows));
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
            let widget = TextareaInput.make(testConfig);
            widget.start({ node: node }).then(() => {
                bus.emit('update', { value: 'some text' });
            });
        });

        it('Should reset to default via bus', (done) => {
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                done();
            });
            let widget = TextareaInput.make(testConfig);
            widget.start({ node: node }).then(() => {
                bus.emit('reset-to-defaults');
            });
        });

        it('Should respond to input change events with "changed"', (done) => {
            let widget = TextareaInput.make(testConfig);
            const inputText = 'here is some text';
            bus.on('changed', (message) => {
                expect(message.newValue).toEqual(inputText);
                widget.stop().then(done);
            });
            widget.start({ node: node }).then(() => {
                let inputElem = node.querySelector('textarea');
                inputElem.value = inputText;
                inputElem.dispatchEvent(new Event('change'));
            });
        });

        it('Should respond to input change events with "validation"', (done) => {
            let widget = TextareaInput.make(testConfig);
            const inputText = 'here is some text';
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                expect(message.errorMessage).toBeUndefined();
                done();
            });
            widget.start({ node: node }).then(() => {
                let inputElem = node.querySelector('textarea');
                inputElem.value = inputText;
                inputElem.dispatchEvent(new Event('change'));
            });
        });

        xit('Should respond to keyup change events with "changed"', (done) => {
            let widget = TextareaInput.make(testConfig);
            const inputText = 'here is some text';
            bus.on('changed', (message) => {
                // expect(message.newValue).toBe(inputText);
                expect(message.isValid).toBeTruthy();
                // ...detect something?
                console.log('Caught a change message!');
                // done();
            });
            widget.start({ node: node }).then(() => {
                let inputElem = node.querySelector('textarea');
                console.log('here is the elem', inputElem);
                inputElem.value = inputText;
                inputElem.dispatchEvent(new Event('keyup'));
            });
        });

        it('Should show message when configured', (done) => {
            testConfig.showOwnMessages = true;
            let widget = TextareaInput.make(testConfig);
            const inputText = 'some text';
            bus.on('changed', (message) => {
                expect(message.newValue).toBe(inputText);
                // ...detect something?
                done();
            });
            widget.start({ node: node }).then(() => {
                let inputElem = node.querySelector('textarea');
                inputElem.value = inputText;
                inputElem.dispatchEvent(new Event('change'));
            });
        });

        it('Should return a diagnosis of required-missing if so', (done) => {
            testConfig = buildTestConfig(true, '', bus);
            let widget = TextareaInput.make(testConfig);
            const inputText = null;
            bus.on('validation', (message) => {
                expect(message.isValid).toBeFalsy();
                expect(message.diagnosis).toBe('required-missing');
                // ...detect something?
                done();
            });
            widget.start({ node: node }).then(() => {
                let inputElem = node.querySelector('textarea');
                inputElem.value = inputText;
                inputElem.dispatchEvent(new Event('change'));
            });
        });
    });
});
