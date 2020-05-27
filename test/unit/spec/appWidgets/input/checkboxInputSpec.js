/*eslint-env jasmine*/
define([
    'widgets/appWidgets2/input/checkboxInput',
    'common/runtime',
    'base/js/namespace',
    'kbaseNarrative',
    'testUtil'
], function(
    CheckboxInput,
    Runtime,
    Jupyter,
    Narrative,
    TestUtil
) {
    'use strict';

    describe('Test checkbox data input widget', function() {
        let testConfig = {},
            runtime,
            bus;

        beforeEach(function() {
            runtime = Runtime.make();
            bus = runtime.bus().makeChannelBus({
                description: 'checkbox testing'
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

        it('should be real!', function() {
            expect(CheckboxInput).not.toBeNull();
        });

        it('should instantiate with a test config', function() {
            TestUtil.pendingIfNoToken();
            var widget = CheckboxInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
        });

        it('should start and stop properly without initial value', (done) => {
            let widget = CheckboxInput.make(testConfig);
            let node = document.createElement('div');
            widget.start({node: node})
                .then(() => {
                    expect(node.childElementCount).toBeGreaterThan(0);
                    const input = node.querySelector('input[type="checkbox"]');
                    expect(input).toBeDefined();
                    expect(input.getAttribute('checked')).toBeNull();
                    return widget.stop();
                })
                .then(() => {
                    expect(node.childElementCount).toBe(0);
                    done();
                });
        });

        it('should start and stop properly with initial value', (done) => {
            testConfig.initialValue = 1;
            let widget = CheckboxInput.make(testConfig);
            let node = document.createElement('div');
            widget.start({node: node})
                .then(() => {
                    expect(node.childElementCount).toBeGreaterThan(0);
                    const input = node.querySelector('input[type="checkbox"]');
                    expect(input).toBeDefined();
                    expect(input.getAttribute('checked')).not.toBeNull();
                    return widget.stop();
                })
                .then(() => {
                    expect(node.childElementCount).toBe(0);
                    done();
                });

        })

        it('should update model properly', (done) => {
            bus.on('changed', (value) => {
                expect(value).toEqual({newValue: 1});
                done();
            });
            let widget = CheckboxInput.make(testConfig);
            let node = document.createElement('div');
            widget.start({node: node})
                .then(() => {
                    const input = node.querySelector('input[type="checkbox"]');
                    input.setAttribute('checked', true);
                    input.dispatchEvent(new Event('change'));
                });
        });

        it('should show message when configured', (done) => {
            testConfig.showOwnMessaged = true;
            let widget = CheckboxInput.make(testConfig);
            let node = document.createElement('div');
            bus.on('changed', (value) => {
                done();
            });
            widget.start({node: node})
                .then(() => {
                    const input = node.querySelector('input[type="checkbox"]');
                    input.setAttribute('checked', true);
                    input.dispatchEvent(new Event('change'));
                });
        });
    });
});
