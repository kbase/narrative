define(['widgets/appWidgets2/input/floatInput', 'common/runtime', 'testUtil'], (
    FloatInput,
    Runtime,
    TestUtil
) => {
    'use strict';

    describe('Test float data input widget', () => {
        let testConfig = {},
            runtime,
            bus,
            container;

        beforeEach(() => {
            runtime = Runtime.make();
            bus = runtime.bus().makeChannelBus({
                description: 'float testing',
            });
            testConfig = {
                parameterSpec: {
                    data: {
                        defaultValue: 1.0,
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
            container.remove();
            bus.stop();
            runtime.destroy();
            TestUtil.clearRuntime();
        });

        it('should be defined', () => {
            expect(FloatInput).not.toBeNull();
        });

        it('should be instantiable', () => {
            const widget = FloatInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start and stop properly without initial value', async () => {
            const widget = FloatInput.make(testConfig);
            await widget.start({ node: container });
            expect(container.childElementCount).toBeGreaterThan(0);
            const input = container.querySelector('input[data-type="float"]');
            expect(input).toBeDefined();
            expect(input.getAttribute('value')).toBe(testConfig.parameterSpec.data.nullValue);
            await widget.stop();
            expect(container.childElementCount).toBe(0);
        });

        it('should start and stop properly with initial value', async () => {
            testConfig.initialValue = 10.0;
            const widget = FloatInput.make(testConfig);
            await widget.start({ node: container });
            expect(container.childElementCount).toBeGreaterThan(0);
            const input = container.querySelector('input[data-type="float"]');
            expect(input).toBeDefined();
            expect(input.getAttribute('value')).toBe(String(testConfig.initialValue));
            await widget.stop();
            expect(container.childElementCount).toBe(0);
        });

        it('should update model properly with change event', async () => {
            let changeMsg;
            bus.on('changed', (value) => {
                changeMsg = value;
            });
            const widget = FloatInput.make(testConfig);
            await widget.start({ node: container });
            const input = container.querySelector('input[data-type="float"]');
            input.setAttribute('value', 1.2);
            input.dispatchEvent(new Event('change'));
            await TestUtil.wait(500);
            expect(changeMsg).toEqual({ newValue: 1.2 });
        });

        it('should update model properly with keyup/touch event', async () => {
            const widget = FloatInput.make(testConfig);
            let validMsg;
            bus.on('validation', (message) => {
                validMsg = message;
            });
            await widget.start({ node: container });
            const input = container.querySelector('input[data-type="float"]');
            input.setAttribute('value', 1.23);
            input.dispatchEvent(new Event('keyup'));
            await TestUtil.wait(500);
            expect(validMsg.isValid).toBeTruthy();
        });

        it('should catch invalid string input', async () => {
            const widget = FloatInput.make(testConfig);
            let validMsg;
            bus.on('validation', (msg) => {
                validMsg = msg;
            });
            await widget.start({ node: container });
            const input = container.querySelector('input[data-type="float"]');
            input.setAttribute('value', 'abracadabra');
            input.dispatchEvent(new Event('change'));
            await TestUtil.wait(500);
            expect(validMsg.isValid).toBeFalsy();
            expect(validMsg.diagnosis).toBe('invalid');
        });

        it('should show message when configured, valid input', async () => {
            testConfig.showOwnMessages = true;
            const widget = FloatInput.make(testConfig);
            let changeMsg;
            bus.on('changed', (value) => {
                changeMsg = value;
            });
            await widget.start({ node: container });
            const input = container.querySelector('input[data-type="float"]');
            input.setAttribute('value', 123.456);
            input.dispatchEvent(new Event('change'));
            await TestUtil.wait(500);
            expect(changeMsg).toEqual({ newValue: 123.456 });
            // No error message
            const errorMsg = container.querySelector('[data-element="message"]');
            expect(errorMsg.innerHTML).toBe('');
        });

        it('should show message when configured, invalid input', async () => {
            testConfig.showOwnMessages = true;
            const widget = FloatInput.make(testConfig);
            let changeMsg, validMsg;
            bus.on('changed', (value) => {
                changeMsg = value;
            });

            bus.on('validation', (msg) => {
                validMsg = msg;
            });

            await widget.start({ node: container });
            const input = container.querySelector('input[data-type="float"]');
            // this value is out of the allowed range
            input.setAttribute('value', 12345.6);
            input.dispatchEvent(new Event('change'));
            await TestUtil.wait(500);
            expect(changeMsg).toEqual({ newValue: 12345.6 });
            // check for an error message in the node
            const errorMsg = container.querySelector('[data-element="message"]');
            expect(errorMsg.innerHTML).toContain('ERROR');
            expect(validMsg.isValid).toBeFalsy();
            expect(validMsg.diagnosis).toBe('invalid');
        });

        // Currently, this updates the model but not the UI.
        // Since there is no way to access the model via the object
        // interface, this test is disabled.
        xit('should respond to update command', () => {
            const widget = FloatInput.make(testConfig);
            widget.start({ node: container }).then(() => {
                bus.emit('update', { value: '12345.6' });
            });
        });
    });
});
