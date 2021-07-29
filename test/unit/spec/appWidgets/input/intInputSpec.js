define(['widgets/appWidgets2/input/intInput', 'common/runtime'], (IntInput, Runtime) => {
    'use strict';

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    describe('Test int data input widget', () => {
        let testConfig = {},
            runtime,
            bus;

        beforeEach(() => {
            runtime = Runtime.make();
            bus = runtime.bus().makeChannelBus({
                description: 'int input testing',
            });
            testConfig = {
                bus: bus,
                parameterSpec: {
                    data: {
                        defaultValue: 1,
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
        });

        afterEach(() => {
            bus.stop();
            window.kbaseRuntime = null;
        });

        it('should be defined', () => {
            expect(IntInput).not.toBeNull();
        });

        it('should be instantiable', () => {
            const widget = IntInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start and stop properly without initial value', (done) => {
            const widget = IntInput.make(testConfig);
            const node = document.createElement('div');
            widget
                .start({ node: node })
                .then(() => {
                    expect(node.childElementCount).toBeGreaterThan(0);
                    const input = node.querySelector('input[data-type="int"]');
                    expect(input).toBeDefined();
                    expect(input.getAttribute('value')).toBeNull();
                    return widget.stop();
                })
                .then(() => {
                    expect(node.childElementCount).toBe(0);
                    done();
                });
        });

        it('should start and stop properly with initial value', (done) => {
            testConfig.initialValue = 10;
            const widget = IntInput.make(testConfig);
            const node = document.createElement('div');
            widget
                .start({ node: node })
                .then(() => {
                    expect(node.childElementCount).toBeGreaterThan(0);
                    const input = node.querySelector('input[data-type="int"]');
                    expect(input).toBeDefined();
                    expect(input.getAttribute('value')).toBe(String(testConfig.initialValue));
                    return widget.stop();
                })
                .then(() => {
                    expect(node.childElementCount).toBe(0);
                    done();
                });
        });

        it('should update model properly with change event', (done) => {
            bus.on('changed', (value) => {
                expect(value).toEqual({ newValue: 1 });
                done();
            });
            const widget = IntInput.make(testConfig);
            const node = document.createElement('div');
            widget.start({ node: node }).then(() => {
                const input = node.querySelector('input[data-type="int"]');
                input.setAttribute('value', 1);
                input.dispatchEvent(new Event('change'));
            });
        });

        xit('should update model properly with keyup/touch event', (done) => {
            const widget = IntInput.make(testConfig);
            const node = document.createElement('div');
            bus.on('validation', (message) => {
                expect(message.isValid).toBeFalsy();
                done();
            });
            widget.start({ node: node }).then(() => {
                const input = node.querySelector('input[data-type="int"]');
                input.value = 'foo';
                input.setAttribute('value', 'foo');
                input.dispatchEvent(new KeyboardEvent('keyup', { key: 3 }));
            });
        });

        it('should catch invalid string input', (done) => {
            const widget = IntInput.make(testConfig);
            const node = document.createElement('div');
            bus.on('validation', (msg) => {
                expect(msg.isValid).toBeFalsy();
                expect(msg.diagnosis).toBe('invalid');
                done();
            });
            widget.start({ node: node }).then(() => {
                const input = node.querySelector('input[data-type="int"]');
                input.setAttribute('value', 'abracadabra');
                input.dispatchEvent(new Event('change'));
            });
        });

        it('should catch invalid float input', (done) => {
            const widget = IntInput.make(testConfig);
            const node = document.createElement('div');
            bus.on('validation', (msg) => {
                expect(msg.isValid).toBeFalsy();
                expect(msg.diagnosis).toBe('invalid');
                done();
            });
            widget.start({ node: node }).then(() => {
                const input = node.querySelector('input[data-type="int"]');
                input.setAttribute('value', 12345.6);
                input.dispatchEvent(new Event('change'));
            });
        });

        it('should show message when configured, valid input', (done) => {
            testConfig.showOwnMessages = true;
            const widget = IntInput.make(testConfig);
            const node = document.createElement('div');
            bus.on('changed', (value) => {
                expect(value).toEqual({ newValue: 5 });
                // message node will be empty
                const errorMsg = node.querySelector('[data-element="message"]');
                expect(errorMsg.innerHTML).toBe('');
                done();
            });
            widget.start({ node: node }).then(() => {
                const input = node.querySelector('input[data-type="int"]');
                input.setAttribute('value', 5);
                input.dispatchEvent(new Event('change'));
            });
        });

        it('should show message when configured, invalid input', (done) => {
            testConfig.showOwnMessages = true;
            const widget = IntInput.make(testConfig);
            const node = document.createElement('div');
            bus.on('changed', (value) => {
                expect(value).toEqual({ newValue: 123456 });
                // check for an error message in the node
                const errorMsg = node.querySelector('[data-element="message"]');
                expect(errorMsg.innerHTML).toContain('ERROR');
            });
            bus.on('validation', (msg) => {
                expect(msg.isValid).toBeFalsy();
                expect(msg.diagnosis).toBe('invalid');
                done();
            });
            widget.start({ node: node }).then(() => {
                const input = node.querySelector('input[data-type="int"]');
                // this value is out of the allowed range
                input.setAttribute('value', 123456);
                input.dispatchEvent(new Event('change'));
            });
        });

        // this sets the model values but does nothing to the UI
        // and cannot be assessed via the widget API
        // => extremely hard to test
        xit('should respond to update command', () => {
            const widget = IntInput.make(testConfig);
            const node = document.createElement('div');
            widget.start({ node: node }).then(() => {
                bus.emit('update', { value: 12345 });
            });
        });

        // this resets the model values but does nothing to the UI
        // and cannot be assessed via the widget API
        // => extremely hard to test
        xit('should respond to reset command', () => {
            const widget = IntInput.make(testConfig);
            const node = document.createElement('div');
            widget.start({ node: node }).then(() => {
                bus.emit('reset-to-defaults');
            });
        });
    });
});
