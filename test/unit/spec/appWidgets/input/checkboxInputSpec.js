define(['widgets/appWidgets2/input/checkboxInput', 'common/runtime'], (CheckboxInput, Runtime) => {
    'use strict';

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    describe('Test checkbox data input widget', () => {
        let testConfig = {},
            runtime,
            bus;

        beforeEach(() => {
            runtime = Runtime.make();
            bus = runtime.bus().makeChannelBus({
                description: 'checkbox testing',
            });
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
            window.kbaseRuntime = null;
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
            const node = document.createElement('div');
            return widget
                .start({ node: node })
                .then(() => {
                    expect(node.childElementCount).toBeGreaterThan(0);
                    const input = node.querySelector('input[type="checkbox"]');
                    expect(input).toBeDefined();
                    expect(input.getAttribute('checked')).toBeNull();
                    return widget.stop();
                })
                .then(() => {
                    expect(node.childElementCount).toBe(0);
                });
        });

        it('should start and stop properly with initial value', () => {
            testConfig.initialValue = 1;
            const widget = CheckboxInput.make(testConfig);
            const node = document.createElement('div');
            return widget
                .start({ node: node })
                .then(() => {
                    expect(node.childElementCount).toBeGreaterThan(0);
                    const input = node.querySelector('input[type="checkbox"]');
                    expect(input).toBeDefined();
                    expect(input.getAttribute('checked')).not.toBeNull();
                    return widget.stop();
                })
                .then(() => {
                    expect(node.childElementCount).toBe(0);
                });
        });

        it('should update model properly', (done) => {
            bus.on('changed', (value) => {
                expect(value).toEqual({ newValue: 1 });
                done();
            });
            const widget = CheckboxInput.make(testConfig);
            const node = document.createElement('div');
            widget.start({ node: node }).then(() => {
                const input = node.querySelector('input[type="checkbox"]');
                input.setAttribute('checked', true);
                input.dispatchEvent(new Event('change'));
            });
        });
    });
});
