/*eslint-env jasmine*/
define([
    'widgets/appWidgets2/input/floatInput',
    'common/runtime',
    'base/js/namespace',
    'kbaseNarrative',
    'testUtil'
], function(
    FloatInput,
    Runtime,
    Jupyter,
    Narrative,
    TestUtil
) {
    'use strict';

    describe('Test float data input widget', function() {
        let testConfig = {},
            runtime = Runtime.make(),
            bus;

        beforeEach(function() {
            bus = runtime.bus().makeChannelBus({
                description: 'float testing',
                // name: 'float-test-' + Math.floor(Math.random()*10000)
            });
            testConfig = {
                bus: bus,
                parameterSpec: {
                    data: {
                        defaultValue: '',
                        nullValue: '',
                        constraints: {
                            required: false
                        }

                    },
                    original: {
                        text_subdata_options: {}
                    }
                },
                channelName: bus.channelName,
            };

            if (TestUtil.getAuthToken()) {
                document.cookie = 'kbase_session=' + TestUtil.getAuthToken();
                Jupyter.narrative = new Narrative();
                Jupyter.narrative.authToken = TestUtil.getAuthToken();
                Jupyter.narrative.userId = TestUtil.getUserId();
            }
        });
        afterEach(() => {
            bus.stop();
        })

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
            });
            let widget = FloatInput.make(testConfig);
            let node = document.createElement('div');
            widget.start({node: node})
                .then(() => {
                    const input = node.querySelector('input[data-type="float"]');
                    input.setAttribute('value', 1.2);
                    input.dispatchEvent(new Event('change'));
                    return widget.stop();
                })
                .then(done);
        });

        it('should update model properly with keyup/touch event', (done) => {
            let widget = FloatInput.make(testConfig);
            let node = document.createElement('div');
            bus.on('changed', (value) => {
                expect(value).toEqual({newValue: 1.23});
                widget.stop()
                    .then(done);
            });
            widget.start({node: node})
                .then(() => {
                    const input = node.querySelector('input[data-type="float"]');
                    input.setAttribute('value', 1.23);
                    input.dispatchEvent(new Event('keyup'));
                });
        });

        it('should show message when configured', (done) => {
            testConfig.showOwnMessages = true;
            let widget = FloatInput.make(testConfig);
            let node = document.createElement('div');
            widget.start({node: node})
                .then(() => {
                    const input = node.querySelector('input[data-type="float"]');
                    input.setAttribute('value', 5);
                    input.dispatchEvent(new Event('change'));
                    return widget.stop();
                })
                .then(done);
        });

        it('should respond to bus commands', (done) => {
            let widget = FloatInput.make(testConfig);
            let node = document.createElement('div');
            widget.start({node: node})
                .then(() => {
                    const input = node.querySelector('input[data-type="float"]');
                    bus.emit('reset-to-defaults');
                    setTimeout(null, 1000);
                    return widget.stop();
                })
                .then(done);
        });
    });
});
