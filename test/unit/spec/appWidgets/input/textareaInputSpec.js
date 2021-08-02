define(['common/runtime', 'widgets/appWidgets2/input/textareaInput', 'testUtil'], (Runtime, TextareaInput, TestUtil) => {
    'use strict';
    let testConfig;
    const required = false,
        defaultValue = 'some test text',
        numRows = 3;

    afterAll(() => TestUtil.clearRuntime());

    function buildTestConfig(_required, _defaultValue, _bus) {
        return {
            bus: _bus,
            parameterSpec: {
                data: {
                    defaultValue: _defaultValue,
                    nullValue: null,
                    constraints: {
                        required: _required,
                        defaultValue: _defaultValue,
                    },
                },
                ui: {
                    nRows: numRows,
                },
            },
            channelName: _bus.channelName,
        };
    }

    function startWidgetAndSetTextarea(widget, container, inputText) {
        widget.start({ node: container }).then(() => {
            const inputElem = container.querySelector('textarea');
            inputElem.value = inputText;
            inputElem.dispatchEvent(new Event('change'));
        });
    }

    describe('Textarea Input tests', () => {
        let widget, bus, container, runtime
        beforeEach(() => {
            runtime = Runtime.make();
            container = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'textarea testing',
            });
            testConfig = buildTestConfig(required, defaultValue, bus);
            widget = TextareaInput.make(testConfig);
        });

        afterEach(() => {
            bus.stop();
            runtime.destroy();
            TestUtil.clearRuntime();
            container.remove();
        });

        it('should be defined', () => {
            expect(TextareaInput).not.toBeNull();
        });

        it('should be instantiable', () => {
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('Should start and stop a widget', (done) => {
            expect(widget).toBeDefined();
            expect(widget.start).toBeDefined();

            widget
                .start({ node: container })
                .then(() => {
                    // verify it's there.
                    const textarea = container.querySelector('textarea');
                    expect(textarea).toBeDefined();
                    expect(textarea.getAttribute('rows')).toBe(String(numRows));
                    return widget.stop();
                })
                .then(() => {
                    // verify it's gone.
                    expect(container.childElementCount).toBe(0);
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
            widget.start({ node: container }).then(() => {
                bus.emit('update', { value: 'some text' });
            });
        });

        it('Should reset to default via bus', (done) => {
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                done();
            });
            widget.start({ node: container }).then(() => {
                bus.emit('reset-to-defaults');
            });
        });

        it('Should respond to input change events with "changed"', (done) => {
            const inputText = 'here is some text';
            bus.on('changed', (message) => {
                expect(message.newValue).toEqual(inputText);
                widget.stop().then(done);
            });
            startWidgetAndSetTextarea(widget, container, inputText);
        });

        it('Should respond to input change events with "validation"', (done) => {
            const inputText = 'here is some text';
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                expect(message.errorMessage).toBeUndefined();
                done();
            });
            startWidgetAndSetTextarea(widget, container, inputText);
        });

        xit('Should respond to keyup change events with "changed"', () => {
            const inputText = 'here is some text';
            // event does not have e.target defined, so running this test emits
            // Uncaught TypeError: Cannot read property 'dispatchEvent' of null thrown
            bus.on('changed', (message) => {
                // expect(message.newValue).toBe(inputText);
                expect(message.isValid).toBeTruthy();
                // ...detect something?
                // done();
            });
            widget.start({ node: container }).then(() => {
                const inputElem = container.querySelector('textarea');
                inputElem.value = inputText;
                inputElem.dispatchEvent(new Event('keyup'));
            });
        });

        it('Should show message when configured', (done) => {
            testConfig.showOwnMessages = true;
            widget = TextareaInput.make(testConfig);
            const inputText = 'some text';
            bus.on('changed', (message) => {
                expect(message.newValue).toBe(inputText);
                // ...detect something?
                done();
            });
            startWidgetAndSetTextarea(widget, container, inputText);
        });

        it('Should return a diagnosis of required-missing if so', (done) => {
            testConfig = buildTestConfig(true, '', bus);
            widget = TextareaInput.make(testConfig);
            const inputText = null;
            bus.on('validation', (message) => {
                expect(message.isValid).toBeFalsy();
                expect(message.diagnosis).toBe('required-missing');
                // ...detect something?
                done();
            });
            startWidgetAndSetTextarea(widget, container, inputText);
        });
    });
});
