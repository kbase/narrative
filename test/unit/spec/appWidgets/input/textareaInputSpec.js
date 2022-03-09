define(['common/runtime', 'widgets/appWidgets2/input/textareaInput', 'testUtil'], (
    Runtime,
    TextareaInput,
    TestUtil
) => {
    'use strict';
    let testConfig;
    const required = false,
        defaultValue = 'some test text',
        numRows = 3;

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

    async function startWidgetAndSetTextarea(widget, container, inputText) {
        await widget.start({ node: container });
        const inputElem = container.querySelector('textarea');
        inputElem.value = inputText;
        inputElem.dispatchEvent(new Event('change'));
        await TestUtil.wait(1000);
    }

    describe('Textarea Input tests', () => {
        let widget, bus, container, runtime;
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

        it('Should start and stop a widget', async () => {
            expect(widget).toBeDefined();
            expect(widget.start).toBeDefined();

            await widget.start({ node: container });
            // verify it's there.
            const textarea = container.querySelector('textarea');
            expect(textarea).toBeDefined();
            expect(textarea.getAttribute('rows')).toBe(String(numRows));
            await widget.stop();
            expect(container.childElementCount).toBe(0);
        });

        it('Should update value via bus', async () => {
            // start with one value, change it, then reset.
            // check along the way.
            let busMessage;
            bus.on('validation', (message) => {
                busMessage = message;
            });
            await widget.start({ node: container });
            bus.emit('update', { value: 'some text' });
            await TestUtil.wait(1000);
            expect(busMessage.isValid).toBeTruthy();
            await widget.stop();
        });

        it('Should reset to default via bus', async () => {
            let busMessage;
            bus.on('validation', (message) => {
                busMessage = message;
            });
            await widget.start({ node: container });
            bus.emit('reset-to-defaults');
            await TestUtil.wait(1000);
            expect(busMessage.isValid).toBeTruthy();
            await widget.stop();
        });

        it('Should respond to input change events with "changed"', async () => {
            const inputText = 'here is some text';
            let busMessage;
            bus.on('changed', (message) => {
                busMessage = message;
            });
            await startWidgetAndSetTextarea(widget, container, inputText);
            expect(busMessage.newValue).toEqual(inputText);
            await widget.stop();
        });

        it('Should respond to input change events with "validation"', async () => {
            const inputText = 'here is some text';
            let busMessage;
            bus.on('validation', (message) => {
                busMessage = message;
            });
            await startWidgetAndSetTextarea(widget, container, inputText);
            expect(busMessage.isValid).toBeTruthy();
            expect(busMessage.errorMessage).toBeUndefined();
            await widget.stop();
        });

        it('Should respond to keyup change events with "validation"', async () => {
            const inputText = 'here is some text';
            // event does not have e.target defined, so running this test emits
            // Uncaught TypeError: Cannot read property 'dispatchEvent' of null thrown
            let busMessage;
            bus.on('validation', (message) => {
                busMessage = message;
            });
            await widget.start({ node: container });
            const inputElem = container.querySelector('textarea');
            inputElem.value = inputText;
            inputElem.dispatchEvent(new Event('keyup'));
            await TestUtil.wait(1000);
            expect(busMessage.isValid).toBeTruthy();
            expect(busMessage.errorMessage).toBeUndefined();
            await widget.stop();
        });

        it('Should show message when configured', async () => {
            testConfig.showOwnMessages = true;
            widget = TextareaInput.make(testConfig);
            const inputText = 'some text';
            let busMessage;
            bus.on('changed', (message) => {
                busMessage = message;
            });
            await startWidgetAndSetTextarea(widget, container, inputText);
            expect(busMessage.newValue).toBe(inputText);
            await widget.stop();
        });

        it('Should return a diagnosis of required-missing if so', async () => {
            testConfig = buildTestConfig(true, '', bus);
            widget = TextareaInput.make(testConfig);
            let busMessage;
            bus.on('validation', (message) => {
                busMessage = message;
            });
            await startWidgetAndSetTextarea(widget, container, null);
            expect(busMessage.isValid).toBeFalsy();
            expect(busMessage.diagnosis).toBe('required-missing');
            await widget.stop();
        });
    });
});
