define(['widgets/appWidgets2/view/dynamicDropdownView', 'common/runtime', 'testUtil'], (
    DynamicDropdownView,
    Runtime,
    TestUtil
) => {
    'use strict';

    const DEFAULT_VALUE = 'banana';
    const SELECTOR = 'select.form-control[data-element="input"]';

    describe('Dynamic Dropdown View tests', () => {
        beforeEach(function () {
            this.paramSpec = {
                data: {
                    defaultValue: DEFAULT_VALUE,
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
            expect(selectElem.firstChild.text).toBe(displayValue);

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
            await TestUtil.waitForElementChange(selectElem, () => {
                this.bus.emit('reset-to-defaults');
            });
            expect(selectElem.firstChild.text).toBe(DEFAULT_VALUE);
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
            await TestUtil.waitForElementChange(selectElem, () => {
                this.bus.emit('update', {
                    value: updatedValue,
                });
            });
            expect(selectElem.firstChild.text).toBe(updatedValue);
        });
    });
});
