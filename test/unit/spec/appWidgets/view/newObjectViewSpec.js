define(['widgets/appWidgets2/view/newObjectView', 'common/runtime', 'testUtil'], (
    NewObjectView,
    Runtime,
    TestUtil
) => {
    'use strict';

    describe('New Object View widget', () => {
        const paramSpec = {
            id: 'newObj',
            data: {
                defaultValue: null,
                nullValue: null,
                type: 'workspaceObjectName',
            },
        };

        beforeEach(function () {
            this.bus = Runtime.make().bus();
            this.node = document.createElement('div');
            document.body.appendChild(this.node);
        });

        afterEach(function () {
            this.node.remove();
            window.kbaseRuntime = null;
        });

        it('should have a valid constructor', function () {
            const widget = NewObjectView.make({
                parameterSpec: paramSpec,
                bus: this.bus,
                initialValue: 'test',
            });
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start and stop with a given value', function () {
            const inputValue = 'someInputValue';
            const widget = NewObjectView.make({
                parameterSpec: paramSpec,
                bus: this.bus,
                initialValue: inputValue,
            });
            const selector = 'input.form-control[data-element="input"]';
            return widget
                .start()
                .then(() => {
                    return TestUtil.waitForElement(this.node, selector, () => {
                        this.bus.emit('run', { node: this.node });
                    });
                })
                .then(() => {
                    const inputElem = this.node.querySelector(selector);
                    expect(inputElem.getAttribute('value')).toEqual(inputValue);
                    return widget.stop();
                })
                .then(() => {
                    expect(this.node.innerHTML).toEqual('');
                });
        });

        it('should update to a new value and reset', async function () {
            const initialValue = 'someInputValue';
            const newValue = 'newValue';
            const widget = NewObjectView.make({
                parameterSpec: paramSpec,
                bus: this.bus,
                initialValue,
            });
            const selector = 'input.form-control[data-element="input"]';
            await widget.start();
            await TestUtil.waitForElement(this.node, selector, () => {
                this.bus.emit('run', { node: this.node });
            });
            const inputElem = this.node.querySelector(selector);
            expect(inputElem.getAttribute('value')).toEqual(initialValue);
            await TestUtil.waitForElementChange(inputElem, () => {
                this.bus.emit('update', {
                    value: newValue,
                });
            });
            expect(inputElem.getAttribute('value')).toEqual(newValue);
            await TestUtil.waitForElementChange(inputElem, () => {
                this.bus.emit('reset-to-defaults', {});
            });
            expect(inputElem.getAttribute('value')).toBeNull();
            await widget.stop();
            expect(this.node.innerHTML).toEqual('');
        });
    });
});
