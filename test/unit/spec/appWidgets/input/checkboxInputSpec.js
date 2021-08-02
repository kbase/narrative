define(['widgets/appWidgets2/input/checkboxInput', 'common/runtime', 'testUtil'], (CheckboxInput, Runtime, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test checkbox data input widget', () => {
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
            testConfig = {
                bus: bus,
                parameterSpec: {
                    data: {
                        defaultValue: '',
                        nullValue: '',
                        constraints: {
                            required: false,
                        },
                    },
                    original: {
                        text_subdata_options: {},
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

        it('should start and stop properly without initial value', () => {
            const widget = CheckboxInput.make(testConfig);
            return widget
                .start({ node: container })
                .then(() => {
                    expect(container.childElementCount).toBeGreaterThan(0);
                    const input = container.querySelector('input[type="checkbox"]');
                    expect(input).toBeDefined();
                    expect(input.getAttribute('checked')).toBeNull();
                    return widget.stop();
                })
                .then(() => {
                    expect(container.childElementCount).toBe(0);
                });
        });

        it('should start and stop properly with initial value', () => {
            testConfig.initialValue = 1;
            const widget = CheckboxInput.make(testConfig);
            return widget
                .start({ node: container })
                .then(() => {
                    expect(container.childElementCount).toBeGreaterThan(0);
                    const input = container.querySelector('input[type="checkbox"]');
                    expect(input).toBeDefined();
                    expect(input.getAttribute('checked')).not.toBeNull();
                    return widget.stop();
                })
                .then(() => {
                    expect(container.childElementCount).toBe(0);
                });
        });

        it('should update model properly', (done) => {
            bus.on('changed', (value) => {
                expect(value).toEqual({ newValue: 1 });
                done();
            });
            const widget = CheckboxInput.make(testConfig);
            widget.start({ node: container }).then(() => {
                const input = container.querySelector('input[type="checkbox"]');
                input.setAttribute('checked', true);
                input.dispatchEvent(new Event('change'));
            });
        });
    });
});
