define([
    'widgets/appWidgets2/input/checkboxInput',
    'common/runtime',
    'testUtil',
    'widgets/appWidgets2/validators/constants',
], (CheckboxInput, Runtime, TestUtil, Constants) => {
    'use strict';

    describe('The checkbox input widget', () => {
        let testConfig = {},
            runtime,
            bus,
            container;

        beforeEach(() => {
            runtime = Runtime.make();
            bus = runtime.bus().makeChannelBus({
                description: 'checkbox testing',
            });
            container = document.createElement('div');
            document.body.appendChild(container);
            testConfig = {
                bus,
                parameterSpec: {
                    data: {
                        defaultValue: 0,
                        nullValue: 0,
                        constraints: {
                            required: false,
                        },
                    },
                    original: {
                        checkbox_options: {
                            checked_value: 1,
                            unchecked_value: 0,
                        },
                        id: 'some_checkbox',
                    },
                    ui: {
                        label: 'Some Checkbox',
                    },
                },
                channelName: bus.channelName,
            };
        });

        afterEach(() => {
            bus.stop();
            runtime.destroy();
            TestUtil.clearRuntime();
            container.remove();
        });

        it('should be defined', () => {
            expect(CheckboxInput).not.toBeNull();
        });

        it('should instantiate with a test config', () => {
            const widget = CheckboxInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start and stop properly without initial value', async () => {
            const widget = CheckboxInput.make(testConfig);
            await widget.start({ node: container });
            expect(container.childElementCount).toBeGreaterThan(0);
            const input = container.querySelector('input[type="checkbox"]');
            expect(input).toBeDefined();
            expect(input.checked).toBeFalse();
            await widget.stop();
            expect(container.childElementCount).toBe(0);
        });

        it('should start and stop properly with initial value', async () => {
            testConfig.initialValue = 1;
            const widget = CheckboxInput.make(testConfig);
            await widget.start({ node: container });
            expect(container.childElementCount).toBeGreaterThan(0);
            const input = container.querySelector('input[type="checkbox"]');
            expect(input).toBeDefined();
            expect(input.checked).toBeTrue();
            await widget.stop();
            expect(container.childElementCount).toBe(0);
        });

        it('should start and stop properly with initial value', async () => {
            testConfig.initialValue = 0;
            const widget = CheckboxInput.make(testConfig);
            await widget.start({ node: container });
            expect(container.childElementCount).toBeGreaterThan(0);
            const input = container.querySelector('input[type="checkbox"]');
            expect(input).toBeDefined();
            expect(input.checked).toBeFalse();
            await widget.stop();
            expect(container.childElementCount).toBe(0);
        });

        it('should start with a validation message', async () => {
            let validMsg;
            bus.on('validation', (msg) => {
                validMsg = msg;
            });
            const widget = CheckboxInput.make(testConfig);
            await widget.start({ node: container });
            await TestUtil.wait(500);
            expect(validMsg).toEqual({
                isValid: true,
                errorMessage: undefined,
                messageId: undefined,
                diagnosis: 'valid',
                value: 0,
                parsedValue: 0,
            });
            await widget.stop();
        });

        it('should update model properly', async () => {
            let changeMsg;
            bus.on('changed', (value) => {
                changeMsg = value;
            });
            const widget = CheckboxInput.make(testConfig);
            await widget.start({ node: container });
            const input = container.querySelector('input[type="checkbox"]');
            input.checked = true;
            input.dispatchEvent(new Event('change'));
            await TestUtil.wait(500);
            expect(changeMsg).toEqual({ newValue: 1 });
            await widget.stop();
        });

        it('should respond to an update message by changing the value', async () => {
            const widget = CheckboxInput.make(testConfig);
            await widget.start({ node: container });
            const input = container.querySelector('input[type="checkbox"]');
            expect(input.checked).toBeFalse();
            bus.emit('update', { value: 1 });
            await TestUtil.wait(500);
            expect(input.checked).toBeTrue();
            await widget.stop();
        });

        it('should reset the value to default via message', async () => {
            testConfig.initialValue = 1;
            const widget = CheckboxInput.make(testConfig);
            await widget.start({ node: container });
            const input = container.querySelector('input[type="checkbox"]');
            expect(input.checked).toBeTrue();
            bus.emit('reset-to-defaults');
            await TestUtil.wait(500);
            expect(input.checked).toBeFalse();
            await widget.stop();
        });

        describe('error values', () => {
            beforeEach(() => {
                testConfig.initialValue = 'omg_not_a_value';
            });

            it('should show an error if the initial config value is not 1 or 0, without changing the value', async () => {
                const widget = CheckboxInput.make(testConfig);
                let changeMsg, validMsg;
                bus.on('changed', (msg) => {
                    changeMsg = msg;
                });
                bus.on('validation', (msg) => {
                    validMsg = msg;
                });
                await widget.start({ node: container });
                await TestUtil.wait(500);
                const input = container.querySelector('input[type="checkbox"]');
                expect(input.checked).toBeFalse();
                expect(changeMsg).toEqual({ newValue: testConfig.initialValue });
                expect(validMsg).toEqual({
                    isValid: false,
                    messageId: Constants.MESSAGE_IDS.INVALID,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                });
                // it should have the right class
                const errorContainer = container.querySelector(
                    '.kb-appInput__checkbox_error_container'
                );
                expect(errorContainer).not.toBeNull();
                // it should have a cancel button
                expect(
                    errorContainer.querySelector('button.kb-appInput__checkbox_error__close_button')
                ).not.toBeNull();
                // it should have a message
                expect(errorContainer.textContent).toContain(
                    `Invalid value of "${testConfig.initialValue}" for parameter ${testConfig.parameterSpec.ui.label}. Default value of unchecked used.`
                );
            });

            it('the error should be dismissable with a button, and propagate the default value', async () => {
                const widget = CheckboxInput.make(testConfig);
                await widget.start({ node: container });
                const elem = container.querySelector('.kb-appInput__checkbox_container');
                await TestUtil.waitForElementChange(elem, () => {
                    elem.querySelector('button.kb-appInput__checkbox_error__close_button').click();
                });
                return new Promise((resolve) => {
                    // expect 2 changed messages - the initial one with the error, then the second one with
                    // the default value.
                    const changeMsgs = [];
                    bus.on('changed', (changeMsg) => {
                        changeMsgs.push(changeMsg);
                        if (changeMsgs.length === 2) {
                            expect(
                                elem.querySelector('.kb-appInput__checkbox_error_container')
                            ).toBeNull();
                            expect(changeMsgs).toEqual([
                                {
                                    newValue: testConfig.initialValue,
                                },
                                {
                                    newValue: testConfig.parameterSpec.data.defaultValue,
                                },
                            ]);
                            resolve();
                        }
                    });
                });
            });

            it('the error should be dismissable by changing the checkbox', async () => {
                const widget = CheckboxInput.make(testConfig);
                await widget.start({ node: container });
                const elem = container.querySelector('.kb-appInput__checkbox_container');
                await TestUtil.waitForElementChange(elem, () => {
                    container.querySelector('input[type="checkbox"]').click();
                });
                expect(elem.querySelector('.kb-appInput__checkbox_error_container')).toBeNull();
            });
        });
    });
});
