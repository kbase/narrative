/*eslint-env jasmine*/
define([
    'widgets/appWidgets2/input/floatInput',
    'common/runtime',
    'testUtil'
], function(
    FloatInput,
    Runtime,
    TestUtil
) {
    'use strict';

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    describe('Test float data input widget', function() {
        let testConfig = {},
            runtime,
            bus;

        beforeEach(function() {
            runtime = Runtime.make();
            bus = runtime.bus().makeChannelBus({
                description: 'float testing',
                // name: 'float-test-' + Math.floor(Math.random()*10000)
            });
            testConfig = {
                bus: bus,
                parameterSpec: {
                    data: {
                        defaultValue: 1.0,
                        nullValue: '',
                        constraints: {
                            required: false,
                            min: -1000,
                            max: 1000
                        }

                    },
                    original: {
                        text_subdata_options: {}
                    }
                },
                channelName: bus.channelName,
            };
        });

        afterEach(() => {
            bus.stop();
            window.kbaseRuntime = null;
        });

        it('should be real!', function() {
            expect(FloatInput).not.toBeNull();
        });

        it('should instantiate with a test config', function() {
            TestUtil.pendingIfNoToken();
            var widget = FloatInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
        });

        it('should start and stop properly without initial value', (done) => {
            let widget = FloatInput.make(testConfig);
            let node = document.createElement('div');
            widget.start({node: node})
                .then(() => {
                    expect(node.childElementCount).toBeGreaterThan(0);
                    const input = node.querySelector('input[data-type="float"]');
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
            testConfig.initialValue = 10.0;
            let widget = FloatInput.make(testConfig);
            let node = document.createElement('div');
            widget.start({node: node})
                .then(() => {
                    expect(node.childElementCount).toBeGreaterThan(0);
                    const input = node.querySelector('input[data-type="float"]');
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
                expect(value).toEqual({newValue: 1.2});
                done();
            });
            let widget = FloatInput.make(testConfig);
            let node = document.createElement('div');
            widget.start({node: node})
                .then(() => {
                    const input = node.querySelector('input[data-type="float"]');
                    input.setAttribute('value', 1.2);
                    input.dispatchEvent(new Event('change'));
                })
        });

        xit('should update model properly with keyup/touch event', (done) => {
            let widget = FloatInput.make(testConfig);
            let node = document.createElement('div');
            bus.on('validation', (message) => {
                expect(message.isValid).toBeTruthy();
                done();
            });
            widget.start({node: node})
                .then(() => {
                    const input = node.querySelector('input[data-type="float"]');
                    input.setAttribute('value', 1.23);
                    input.dispatchEvent(new Event('keyup'));
                });
        });

        xit('should show message when configured', (done) => {
            testConfig.showOwnMessages = true;
            let widget = FloatInput.make(testConfig);
            let node = document.createElement('div');
            bus.on('validation', done);
            widget.start({node: node})
                .then(() => {
                    const input = node.querySelector('input[data-type="float"]');
                    input.setAttribute('value', 5);
                    input.dispatchEvent(new Event('change'));
                });
        });

        xit('should respond to bus commands', (done) => {
            bus.on('validation', done);
            let widget = FloatInput.make(testConfig);
            let node = document.createElement('div');
            widget.start({node: node})
                .then(() => {
                    bus.emit('update', {value: '12345.6'});
                });
        });
    });
});
