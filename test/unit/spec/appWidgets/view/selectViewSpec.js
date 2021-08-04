define(['widgets/appWidgets2/view/selectView', 'common/runtime', 'testUtil'], (
    SelectView,
    Runtime,
    TestUtil
) => {
    'use strict';

    /**
     * Builds a dummy parameter spec from the array of select options.
     * Each option is a key-value pair with keys "display" and "value", both strings
     * @param {Array} options
     */
    function buildParamSpec(options, defaultValue) {
        return {
            data: {
                constraints: {
                    options,
                },
                defaultValue,
                nullValue: '',
                type: 'string',
            },
        };
    }

    const TEST_VALUES = [
        {
            display: 'Apple',
            value: 'apple',
        },
        {
            display: 'Banana',
            value: 'banana',
        },
        {
            display: 'Carrot',
            value: 'carrot',
        },
    ];

    const DEFAULT_VALUE = 'banana';
    const SELECTOR = 'select.form-control[data-element="input"]';

    describe('Select view tests', () => {
        beforeEach(function () {
            this.paramSpec = buildParamSpec(TEST_VALUES, DEFAULT_VALUE);
            this.bus = Runtime.make().bus();
            this.node = document.createElement('div');
            document.body.appendChild(this.node);
        });

        afterEach(function () {
            this.node.remove();
            TestUtil.clearRuntime();
        });

        it('should have a valid constructor', function () {
            const widget = SelectView.make({
                parameterSpec: this.paramSpec,
                bus: this.bus,
                initialValue: DEFAULT_VALUE,
            });
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        const BASIC_CASES = TEST_VALUES.map((testValue) => {
            return {
                label: `default values showing ${testValue.value}`,
                initialValue: testValue.value,
            };
        });
        BASIC_CASES.push(
            {
                label: 'overridden values',
                overrideValues: [{ value: 'foo', display: 'Foo' }],
                initialValue: 'foo',
            },
            {
                label: 'multiple overridden values',
                overrideValues: [
                    { value: 'foo', display: 'Foo' },
                    { value: 'bar', display: 'Bar' },
                ],
                initialValue: 'bar',
            },
            {
                label: 'unselected values',
                initialValue: '', // empty string is allowed, and expected to be set by the cell
            }
        );

        BASIC_CASES.forEach((testCase) => {
            it(`Should start and stop with ${testCase.label} and show an expected value`, async function () {
                const widget = SelectView.make({
                    parameterSpec: this.paramSpec,
                    bus: this.bus,
                    initialValue: testCase.initialValue,
                    availableValues: testCase.overrideValues,
                });
                await widget.start({ node: this.node });
                const selectElem = this.node.querySelector(SELECTOR);
                expect(selectElem).not.toBeNull();
                const expectedValues = testCase.overrideValues
                    ? testCase.overrideValues
                    : TEST_VALUES;
                expect(selectElem.children.length).toBe(expectedValues.length + 1); // blank is an option
                expect(selectElem.value).toBe(testCase.initialValue);

                await widget.stop();
                expect(this.node.innerHTML).toEqual('');
            });
        });

        it('Should start and revert to a default value', async function () {
            const widget = SelectView.make({
                parameterSpec: this.paramSpec,
                bus: this.bus,
                initialValue: 'carrot',
            });

            await widget.start({ node: this.node });
            const selectElem = this.node.querySelector(SELECTOR);
            expect(selectElem.value).toBe('carrot');
            await TestUtil.waitForElementChange(selectElem, () => {
                this.bus.emit('reset-to-defaults');
            });
            expect(selectElem.value).toBe(DEFAULT_VALUE);
        });

        it('Should start and update its value', async function () {
            const widget = SelectView.make({
                parameterSpec: this.paramSpec,
                bus: this.bus,
                initialValue: DEFAULT_VALUE,
            });

            const updatedValue = 'apple';
            await widget.start({ node: this.node });
            const selectElem = this.node.querySelector(SELECTOR);
            expect(selectElem.value).toBe(DEFAULT_VALUE);
            await TestUtil.waitForElementChange(selectElem, () => {
                this.bus.emit('update', {
                    value: updatedValue,
                });
            });
            expect(selectElem.value).toBe(updatedValue);
        });
    });
});
