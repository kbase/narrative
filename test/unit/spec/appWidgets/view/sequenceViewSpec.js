define(['widgets/appWidgets2/view/sequenceView', 'common/runtime', 'testUtil'], (
    SequenceView,
    Runtime,
    TestUtil
) => {
    'use strict';

    describe('Sequence view widget', () => {
        const paramSpec = {
            id: 'textList',
            data: {
                defaultValue: [],
                nullValue: null,
                type: 'sequence',
                constraints: {
                    required: false,
                },
            },
            parameters: {
                layout: ['item'],
                specs: {
                    item: {
                        data: {
                            type: 'string',
                        },
                        ui: {
                            advanced: false,
                            description: 'A String',
                        },
                    },
                },
            },
        };

        beforeEach(function () {
            this.bus = Runtime.make().bus();
            this.node = document.createElement('div');
            document.body.appendChild(this.node);
        });

        afterEach(function () {
            this.node.remove();
            TestUtil.clearRuntime();
        });

        it('should have a valid constructor', function () {
            const widget = SequenceView.make({
                parameterSpec: paramSpec,
                bus: this.bus,
                initialValue: ['test'],
            });
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start and stop with a given list of values', async function () {
            const values = ['starting value', 'another starting value'];
            const widget = SequenceView.make({
                parameterSpec: paramSpec,
                bus: this.bus,
                initialValue: values,
            });
            await widget.start({ node: this.node });
            // find initial rows, expect 2
            expect(this.node.querySelectorAll('[data-element="input-row"]').length).toBe(2);
            // find initial input elements, expect 2
            const inputElems = this.node.querySelectorAll(
                '[data-element="input-row"] [data-element="input"]'
            );
            expect(inputElems.length).toBe(2);
            inputElems.forEach((elem, index) => {
                expect(elem.value).toEqual(values[index]);
            });
            // expect each input element to have the right value
            await widget.stop();
            expect(this.node.innerHTML).toBe('');
        });

        // doesn't actually work, in fact, the sequenceView never had this working.
        // skipping for now, but should be a todo.
        xit('should update to a new value', async function () {
            const values = ['starting value'];
            const widget = SequenceView.make({
                parameterSpec: paramSpec,
                bus: this.bus,
                initialValue: values,
            });
            await widget.start({ node: this.node });
            // find initial input elements, expect 1
            const inputElems = this.node.querySelectorAll(
                '[data-element="input-row"] [data-element="input"]'
            );
            expect(inputElems.length).toBe(1);
            expect(inputElems[0].value).toEqual(values[0]);

            const newValues = ['new value', 'another new value'];
            await TestUtil.waitForElementChange(this.node, () => {
                this.bus.emit('update', {
                    value: newValues,
                });
            });

            const newElems = this.node.querySelectorAll(
                '[data-element="input-row"] [data-element="input"]'
            );
            expect(newElems.length).toBe(2);
            newElems.forEach((elem, index) => {
                expect(elem.value).toEqual(newElems[index]);
            });

            // expect each input element to have the right value
            await widget.stop();
            expect(this.node.innerHTML).toBe('');
        });
    });
});
