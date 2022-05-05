define(['widgets/appWidgets2/view/structView', 'common/runtime', 'testUtil'], (
    StructView,
    Runtime,
    TestUtil
) => {
    'use strict';

    describe('Struct view widget', () => {
        const parameterSpec = {
            data: {
                id: 'test_param_group',
                type: 'struct',
                constraints: {
                    required: false,
                },
            },
            ui: {
                advanced: false,
                class: 'parameter',
                label: 'A Parameter Group',
                layout: ['checkboxParam', 'stringParam'],
            },
            parameters: {
                layout: ['checkboxParam', 'stringParam'],
                specs: {
                    checkboxParam: {
                        id: 'checkboxParam',
                        data: {
                            type: 'int',
                            constraints: {
                                required: false,
                                min: 0,
                                max: 1,
                            },
                            defaultValue: 0,
                        },
                        ui: {
                            advanced: false,
                            type: 'checkbox',
                            control: 'checkbox',
                        },
                    },
                    stringParam: {
                        id: 'stringParam',
                        data: {
                            constraints: {
                                required: false,
                            },
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
            const widget = StructView.make({
                parameterSpec,
                bus: this.bus,
                initialValue: {},
            });
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start and stop with a given initial value', async function () {
            const vals = {
                checkboxParam: 1,
                stringParam: 'some string',
            };
            const widget = StructView.make({
                parameterSpec,
                bus: this.bus,
                initialValue: vals,
            });
            await widget.start({ node: this.node });
            const fieldElems = this.node.querySelectorAll('.kb-appInput__struct__field');
            expect(fieldElems.length).toBe(2);

            // from the layout order in the parameterSpec - expect checkbox and then string
            expect(fieldElems[0].querySelector('input[type="checkbox"]').value).toBe('1');
            expect(fieldElems[1].querySelector('input').value).toEqual(vals.stringParam);

            await widget.stop();
            expect(this.node.innerHTML).toBe('');
        });
    });
});
