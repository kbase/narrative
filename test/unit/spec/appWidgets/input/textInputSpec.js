define(['common/runtime', 'widgets/appWidgets2/input/textInput', 'testUtil'], (
    Runtime,
    TextInput,
    TestUtil
) => {
    'use strict';
    let testConfig;
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

    async function startWidgetAndSetTextField(widget, node, inputText) {
        await widget.start({ node });
        const inputElem = node.querySelector('input[data-element="input"]');
        inputElem.value = inputText;
        inputElem.dispatchEvent(new Event('change'));
        await TestUtil.wait(1000); // should fire expected messages by then
    }

    describe('The Text Input widget', () => {
        let bus, container, runtime;
        beforeEach(() => {
            runtime = Runtime.make();
            container = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'text input testing',
            });
            testConfig = buildTestConfig(required, defaultValue, bus);
        });

        afterEach(() => {
            bus.stop();
            runtime.destroy();
            container.remove();
            TestUtil.clearRuntime();
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

        it('Should start and stop a widget', async () => {
            const widget = TextInput.make(testConfig);
            await widget.start({ node: container });
            // verify it's there.
            const inputElem = container.querySelector('input[data-element="input"]');
            expect(inputElem).toBeDefined();
            await widget.stop();
            expect(container.childElementCount).toBe(0);
        });

        it('Should update value via bus', async () => {
            // start with one value, change it, then reset.
            // check along the way.
            const widget = TextInput.make(testConfig);
            let validationMsg;
            bus.on('validation', (message) => {
                validationMsg = message;
            });
            await widget.start({ node: container });
            bus.emit('update', { value: 'some text' });
            await TestUtil.wait(1000);
            expect(validationMsg.isValid).toBeTruthy();
        });

        it('Should reset to default via bus', async () => {
            const widget = TextInput.make(testConfig);
            let validationMsg;
            bus.on('validation', (message) => {
                validationMsg = message;
            });
            await widget.start({ node: container });
            bus.emit('reset-to-defaults');
            await TestUtil.wait(1000);
            expect(validationMsg.isValid).toBeTruthy(); // fires after reset
        });

        it('Should respond to input change events with "changed"', async () => {
            const inputText = 'here is some text';
            const widget = TextInput.make(testConfig);
            let changedMsg;
            bus.on('changed', (message) => {
                changedMsg = message;
            });
            await startWidgetAndSetTextField(widget, container, inputText);
            expect(changedMsg.newValue).toEqual(inputText);
        });

        it('Should respond to input change events with "validation"', async () => {
            const inputText = 'here is some text';
            const widget = TextInput.make(testConfig);
            let validationMsg;
            bus.on('validation', (message) => {
                validationMsg = message;
            });
            await startWidgetAndSetTextField(widget, container, inputText);
            expect(validationMsg.isValid).toBeTruthy();
            expect(validationMsg.errorMessage).toBeUndefined();
        });

        it('Should respond to keyup change events with "validation"', async () => {
            const inputText = 'here is some text';
            const widget = TextInput.make(testConfig);
            let validationMsg;
            bus.on('validation', (message) => {
                validationMsg = message;
            });
            await widget.start({ node: container });
            const inputElem = container.querySelector('input[data-element="input"]');
            inputElem.value = inputText;
            inputElem.dispatchEvent(new Event('keyup'));
            await TestUtil.wait(1000);
            expect(validationMsg.isValid).toBeTruthy();
            expect(validationMsg.errorMessage).toBeUndefined();
        });

        it('Should show message when configured', async () => {
            testConfig.showOwnMessages = true;
            const widget = TextInput.make(testConfig);
            const inputText = 'some text';
            let validationMsg;
            bus.on('validation', (message) => {
                validationMsg = message;
            });
            await startWidgetAndSetTextField(widget, container, inputText);
            expect(validationMsg.isValid).toBeTruthy();
        });

        it('Should return a diagnosis of required-missing if so', async () => {
            const _bus = runtime.bus().makeChannelBus({
                description: 'text input testing',
            });

            testConfig = buildTestConfig(true, '', _bus);
            const widget = TextInput.make(testConfig);
            const _container = document.createElement('div');
            let validationMessage;
            _bus.on('validation', (message) => {
                validationMessage = message;
            });
            await startWidgetAndSetTextField(widget, _container, null);
            expect(validationMessage.isValid).toBeFalsy();
            expect(validationMessage.diagnosis).toBe('required-missing');
        });
    });
});
