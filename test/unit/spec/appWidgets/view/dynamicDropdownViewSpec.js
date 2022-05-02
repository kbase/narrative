define(['jquery', 'widgets/appWidgets2/view/dynamicDropdownView', 'common/runtime', 'testUtil'], (
    $,
    DynamicDropdownView,
    Runtime,
    TestUtil
) => {
    'use strict';

    const DEFAULT_VALUE = 'banana';
    const SELECTOR = 'select.form-control[data-element="input"]';
    const SELECT2_OPTION_SELECTOR = '.select2-container .select2-selection__rendered';

    describe('Dynamic Dropdown View tests', () => {
        beforeEach(function () {
            this.paramSpec = {
                data: {
                    defaultValue: DEFAULT_VALUE,
                },
                original: {},
            };
            this.templateParamSpec = {
                data: {
                    defaultValue: DEFAULT_VALUE,
                },
                original: {
                    dynamic_dropdown_options: {
                        description_template: 'value: {{someKey}}',
                        selection_id: 'selection_id',
                    },
                },
            };
            this.bus = Runtime.make().bus();
            this.node = document.createElement('div');
            document.body.appendChild(this.node);
        });

        afterEach(function () {
            this.node.remove();
            TestUtil.clearRuntime();
        });

        it('should have a valid constructor', function () {
            const widget = DynamicDropdownView.make({
                parameterSpec: this.paramSpec,
                bus: this.bus,
                initialValue: DEFAULT_VALUE,
            });
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it(`Should start and stop with an initial value and show an expected value`, async function () {
            const displayValue = 'foo';
            const widget = DynamicDropdownView.make({
                parameterSpec: this.paramSpec,
                bus: this.bus,
                initialValue: displayValue,
            });
            await widget.start({ node: this.node });
            const selectElem = this.node.querySelector(SELECTOR);
            expect(selectElem).not.toBeNull();
            expect(selectElem.children.length).toBe(1); // blank is an option
            expect($(selectElem).select2('data')[0].text).toBe(displayValue);

            await widget.stop();
            expect(this.node.innerHTML).toEqual('');
        });

        it('Should start and revert to a default value', async function () {
            const displayValue = 'foo';
            const widget = DynamicDropdownView.make({
                parameterSpec: this.paramSpec,
                bus: this.bus,
                initialValue: displayValue,
            });

            await widget.start({ node: this.node });
            const selectElem = this.node.querySelector(SELECTOR);
            expect(selectElem.firstChild.text).toBe(displayValue);
            await TestUtil.waitForElementChange(
                this.node.querySelector('.select2-container'),
                () => {
                    this.bus.emit('reset-to-defaults');
                }
            );
            expect($(selectElem).select2('data')[0].text).toBe(DEFAULT_VALUE);
            await widget.stop();
        });

        it('Should start and update its value', async function () {
            const widget = DynamicDropdownView.make({
                parameterSpec: this.paramSpec,
                bus: this.bus,
                initialValue: DEFAULT_VALUE,
            });

            const updatedValue = 'apple';
            await widget.start({ node: this.node });
            const selectElem = this.node.querySelector(SELECTOR);
            expect(selectElem.firstChild.text).toBe(DEFAULT_VALUE);
            await TestUtil.waitForElementChange(
                this.node.querySelector('.select2-container'),
                () => {
                    this.bus.emit('update', {
                        value: updatedValue,
                    });
                }
            );

            expect($(selectElem).select2('data')[0].text).toBe(updatedValue);
            await widget.stop();
        });

        const TEST_DISPLAY_VAL = 'display value';
        [
            {
                dv: { someKey: TEST_DISPLAY_VAL },
                expected: `value: ${TEST_DISPLAY_VAL}`,
            },
            {
                dv: null,
                expected: DEFAULT_VALUE,
            },
            {
                dv: { not_used_key: TEST_DISPLAY_VAL },
                expected: DEFAULT_VALUE,
            },
        ].forEach((testCase) => {
            it(`Should render with display value: ${JSON.stringify(
                testCase.dv
            )}`, async function () {
                const widget = DynamicDropdownView.make({
                    parameterSpec: this.templateParamSpec,
                    bus: this.bus,
                    initialValue: DEFAULT_VALUE,
                    initialDisplayValue: testCase.dv,
                });

                await widget.start({ node: this.node });
                const selectElem = this.node.querySelector(SELECTOR);
                expect(selectElem).not.toBeNull();
                expect(selectElem.children.length).toBe(1); // blank is an option
                expect(this.node.querySelector(SELECT2_OPTION_SELECTOR).textContent).toBe(
                    testCase.expected
                );

                await widget.stop();
            });
        });

        it('Should update to submitted display value from default', async function () {
            const widget = DynamicDropdownView.make({
                parameterSpec: this.templateParamSpec,
                bus: this.bus,
                initialValue: DEFAULT_VALUE,
            });

            const updateValue = 'apple';
            const updateDisplayValue = { someKey: 'some display value' };
            await widget.start({ node: this.node });
            const selectElem = this.node.querySelector(SELECTOR);
            expect(selectElem.firstChild.text).toBe(DEFAULT_VALUE);
            await TestUtil.waitForElementChange(
                this.node.querySelector('.select2-container'),
                () => {
                    this.bus.emit('update', {
                        value: updateValue,
                        displayValue: updateDisplayValue,
                    });
                }
            );

            expect(this.node.querySelector(SELECT2_OPTION_SELECTOR).textContent).toBe(
                `value: ${updateDisplayValue.someKey}`
            );
            await widget.stop();
        });
    });
});
