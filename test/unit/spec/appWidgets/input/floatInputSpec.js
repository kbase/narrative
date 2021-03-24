define(['widgets/appWidgets2/input/floatInput', 'common/runtime'], (FloatInput, Runtime) => {
    'use strict';

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
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
            window.kbaseRuntime = null;
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

        it('should start and stop properly without initial value', (done) => {
            const widget = FloatInput.make(testConfig);
            widget
                .start({ node: container })
                .then(() => {
                    expect(container.childElementCount).toBeGreaterThan(0);
                    const input = container.querySelector('input[data-type="float"]');
                    expect(input).toBeDefined();
                    expect(input.getAttribute('value')).toBeNull();
                    return widget.stop();
                })
                .then(() => {
                    expect(container.childElementCount).toBe(0);
                    done();
                });
        });

        it('should start and stop properly with initial value', (done) => {
            testConfig.initialValue = 10.0;
            const widget = FloatInput.make(testConfig);
            widget
                .start({ node: container })
                .then(() => {
                    expect(container.childElementCount).toBeGreaterThan(0);
                    const input = container.querySelector('input[data-type="float"]');
                    expect(input).toBeDefined();
                    expect(input.getAttribute('value')).toBe(String(testConfig.initialValue));
                    return widget.stop();
                })
                .then(() => {
                    expect(container.childElementCount).toBe(0);
                    done();
                });
        });

        it('should update model properly with change event', (done) => {
            bus.on('changed', (value) => {
                expect(value).toEqual({ newValue: 1.2 });
                done();
            });
            const widget = FloatInput.make(testConfig);
            widget.start({ node: container }).then(() => {
                const input = container.querySelector('input[data-type="float"]');
                input.setAttribute('value', 1.2);
                input.dispatchEvent(new Event('change'));
            });
        });

        xit('should update model properly with keyup/touch event', (done) => {
            const widget = FloatInput.make(testConfig);
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                done();
            });
            widget.start({ node: container }).then(() => {
                const input = container.querySelector('input[data-type="float"]');
                input.setAttribute('value', 1.23);
                input.dispatchEvent(new Event('keyup'));
            });
        });

        it('should catch invalid string input', (done) => {
            const widget = FloatInput.make(testConfig);
            bus.on('validation', (msg) => {
                expect(msg.isValid).toBeFalsy();
                expect(msg.diagnosis).toBe('invalid');
                done();
            });
            widget.start({ node: container }).then(() => {
                const input = container.querySelector('input[data-type="float"]');
                input.setAttribute('value', 'abracadabra');
                input.dispatchEvent(new Event('change'));
            });
        });

        it('should show message when configured, valid input', (done) => {
            testConfig.showOwnMessages = true;
            const widget = FloatInput.make(testConfig);
            bus.on('changed', (value) => {
                expect(value).toEqual({ newValue: 123.456 });
                // No error message
                const errorMsg = container.querySelector('[data-element="message"]');
                expect(errorMsg.innerHTML).toBe('');
                done();
            });
            widget.start({ node: container }).then(() => {
                const input = container.querySelector('input[data-type="float"]');
                input.setAttribute('value', 123.456);
                input.dispatchEvent(new Event('change'));
            });
        });

        it('should show message when configured, invalid input', (done) => {
            testConfig.showOwnMessages = true;
            const widget = FloatInput.make(testConfig);
            bus.on('changed', (value) => {
                expect(value).toEqual({ newValue: 12345.6 });
                // check for an error message in the node
                const errorMsg = container.querySelector('[data-element="message"]');
                expect(errorMsg.innerHTML).toContain('ERROR');
            });

            bus.on('validation', (msg) => {
                expect(msg.isValid).toBeFalsy();
                expect(msg.diagnosis).toBe('invalid');
                done();
            });

            widget.start({ node: container }).then(() => {
                const input = container.querySelector('input[data-type="float"]');
                // this value is out of the allowed range
                input.setAttribute('value', 12345.6);
                input.dispatchEvent(new Event('change'));
            });
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
