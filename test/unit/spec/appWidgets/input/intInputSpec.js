define(['widgets/appWidgets2/input/intInput', 'common/runtime', 'testUtil'], (
    IntInput,
    Runtime,
    TestUtil
) => {
    'use strict';

    describe('Test int data input widget', () => {
        let testConfig = {},
            runtime,
            bus,
            container;

        beforeEach(() => {
            runtime = Runtime.make();
            bus = runtime.bus().makeChannelBus({
                description: 'int input testing',
            });
            testConfig = {
                bus: bus,
                parameterSpec: {
                    data: {
                        defaultValue: 1,
                        nullValue: '',
                        constraints: {
                            required: false,
                            min: -1000,
                            max: 1000,
                        },
                    },
                    original: {
                        text_subdata_options: {},
                    },
                },
                channelName: bus.channelName,
            };
            container = document.createElement('div');
        });

        afterEach(() => {
            bus.stop();
            runtime.destroy();
            TestUtil.clearRuntime();
            container.remove();
        });

        it('should be defined', () => {
            expect(IntInput).not.toBeNull();
        });

        it('should be instantiable', () => {
            const widget = IntInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start and stop properly without initial value', async () => {
            const widget = IntInput.make(testConfig);
            await widget.start({ node: container });
            expect(container.childElementCount).toBeGreaterThan(0);
            const input = container.querySelector('input[data-type="int"]');
            expect(input).toBeDefined();
            expect(input.getAttribute('value')).toBe(testConfig.parameterSpec.data.nullValue);
            await widget.stop();
            expect(container.childElementCount).toBe(0);
        });

        it('should start and stop properly with initial value', async () => {
            testConfig.initialValue = 10;
            const widget = IntInput.make(testConfig);
            await widget.start({ node: container });
            expect(container.childElementCount).toBeGreaterThan(0);
            const input = container.querySelector('input[data-type="int"]');
            expect(input).toBeDefined();
            expect(input.getAttribute('value')).toBe(String(testConfig.initialValue));
            await widget.stop();
            expect(container.childElementCount).toBe(0);
        });

        it('should update model properly with change event', async () => {
            const widget = IntInput.make(testConfig);
            let changeMsg;
            bus.on('changed', (value) => {
                changeMsg = value;
            });
            await widget.start({ node: container });
            const input = container.querySelector('input[data-type="int"]');
            input.setAttribute('value', 1);
            input.dispatchEvent(new Event('change'));
            await TestUtil.wait(500);
            expect(changeMsg).toEqual({ newValue: 1 });
            await widget.stop();
        });

        it('should update model properly with keyup event', async () => {
            const widget = IntInput.make(testConfig);
            let validMsg;
            bus.on('validation', (message) => {
                validMsg = message;
            });
            await widget.start({ node: container });
            const input = container.querySelector('input[data-type="int"]');
            input.value = 'foo';
            input.setAttribute('value', 'foo');
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 3 }));
            await TestUtil.wait(500);
            expect(validMsg.isValid).toBeFalsy();
            await widget.stop();
        });

        it('should catch invalid string input', async () => {
            const widget = IntInput.make(testConfig);
            let validMsg;
            bus.on('validation', (msg) => {
                validMsg = msg;
            });
            await widget.start({ node: container });

            const input = container.querySelector('input[data-type="int"]');
            input.setAttribute('value', 'abracadabra');
            input.dispatchEvent(new Event('change'));
            await TestUtil.wait(500);
            expect(validMsg.isValid).toBeFalsy();
            expect(validMsg.diagnosis).toBe('invalid');
            await widget.stop();
        });

        it('should catch invalid float input', async () => {
            const widget = IntInput.make(testConfig);
            let validMsg;
            bus.on('validation', (msg) => {
                validMsg = msg;
            });
            await widget.start({ node: container });
            const input = container.querySelector('input[data-type="int"]');
            input.setAttribute('value', 12345.6);
            input.dispatchEvent(new Event('change'));
            await TestUtil.wait(500);
            expect(validMsg.isValid).toBeFalsy();
            expect(validMsg.diagnosis).toBe('invalid');
            await widget.stop();
        });

        it('should show message when configured, valid input', async () => {
            testConfig.showOwnMessages = true;
            const widget = IntInput.make(testConfig);
            let changeMsg;
            bus.on('changed', (value) => {
                changeMsg = value;
            });
            await widget.start({ node: container });
            const input = container.querySelector('input[data-type="int"]');
            input.setAttribute('value', 5);
            input.dispatchEvent(new Event('change'));
            await TestUtil.wait(500);
            expect(changeMsg).toEqual({ newValue: 5 });
            // message node will be empty
            const errorMsg = container.querySelector('[data-element="message"]');
            expect(errorMsg.innerHTML).toBe('');
            await widget.stop();
        });

        it('should show message when configured, invalid input', async () => {
            testConfig.showOwnMessages = true;
            const widget = IntInput.make(testConfig);
            let changeMsg;
            bus.on('changed', (value) => {
                changeMsg = value;
            });
            let validMsg;
            bus.on('validation', (msg) => {
                validMsg = msg;
            });
            await widget.start({ node: container });
            const input = container.querySelector('input[data-type="int"]');
            // this value is out of the allowed range
            input.setAttribute('value', 123456);
            input.dispatchEvent(new Event('change'));
            await TestUtil.wait(1000);
            expect(changeMsg).toEqual({ newValue: 123456 });
            // check for an error message in the node
            const errorMsg = container.querySelector('[data-element="message"]');
            expect(errorMsg.innerHTML).toContain('ERROR');
            expect(validMsg.isValid).toBeFalsy();
            expect(validMsg.diagnosis).toBe('invalid');
        });

        // this sets the model values but does nothing to the UI
        // and cannot be assessed via the widget API
        // => extremely hard to test
        xit('should respond to update command', () => {
            const widget = IntInput.make(testConfig);
            widget.start({ node: container }).then(() => {
                bus.emit('update', { value: 12345 });
            });
        });

        // this resets the model values but does nothing to the UI
        // and cannot be assessed via the widget API
        // => extremely hard to test
        xit('should respond to reset command', () => {
            const widget = IntInput.make(testConfig);
            widget.start({ node: container }).then(() => {
                bus.emit('reset-to-defaults');
            });
        });
    });
});
