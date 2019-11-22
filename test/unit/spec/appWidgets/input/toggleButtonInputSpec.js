define([
    'testUtil',
    'common/runtime',
    'base/js/namespace',
    'kbaseNarrative',
    'widgets/appWidgets2/input/toggleButtonInput'
], (
    TestUtil,
    Runtime,
    Jupyter,
    Narrative,
    ToggleButtonInput
) => {
    'use strict';
    let bus,
        testConfig,
        required = false,
        runtime = Runtime.make(),
        node,
        defaultValue = true;

    function buildTestConfig(required, defaultValue, bus) {
        return {
            bus: bus,
            parameterSpec: {
                data: {
                    defaultValue: defaultValue,
                    nullValue: null,
                    constraints: {
                        required: required
                    }
                },
                defaultValue: () => defaultValue,
                required: () => required
            },
            channelName: bus.channelName
        };
    }

    describe('ToggleButtonInput tests', () => {
        beforeEach(() => {
            node = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'toggle button testing',
            });
            testConfig = buildTestConfig(required, defaultValue, bus);
        });

        it('Should load the widget', () => {
            expect(ToggleButtonInput).not.toBeNull();
        });

        it('Should instantiate a widget', (done) => {
            let widget = ToggleButtonInput.make(testConfig);
            expect(widget).toBeDefined();
            expect(widget.start).toBeDefined();

            // fires 'sync' after starting, then we can tell it to 'update',
            // which does the rendering. THEN we can examine that it's rendered right.
            bus.on('sync', () => {
                expect(node.querySelector('[data-element="main-panel"]')).toBeDefined();
                bus.emit('update', {value: true});
                setTimeout(() => {
                    let inputElem = node.querySelector('input[type="checkbox"]');
                    expect(inputElem).toBeDefined();
                    expect(inputElem.getAttribute('checked')).not.toBeNull();
                    done();
                }, 100);
            });

            widget.start()
                .then(() => {
                    bus.emit('run', {node: node});
                });
        });

        it('Should update value and reset properly via bus', (done, fail) => {
            // start with one value, change it, then reset.
            // check along the way.
            let widget = ToggleButtonInput.make(testConfig);
            bus.on('sync', () => {
                bus.emit('update', {value: defaultValue}); // no change, just verify it's there.
                TestUtil.wait(100)
                    .then(() => {
                        let inputElem = node.querySelector('input[type="checkbox"]');
                        expect(inputElem.getAttribute('checked')).not.toBeNull();
                        bus.emit('update', {value: 0});
                        return TestUtil.wait(100);
                    })
                    .then(() => {
                        let inputElem = node.querySelector('input[type="checkbox"]');
                        expect(inputElem.getAttribute('checked')).toBeNull();
                        bus.emit('reset-to-defaults');
                        return TestUtil.wait(100);
                    })
                    .then(() => {
                        let inputElem = node.querySelector('input[type="checkbox"]');
                        expect(inputElem.getAttribute('checked')).not.toBeNull();
                        done();
                    })
                    .catch(fail);
            });
            widget.start().then(() => {bus.emit('run', {node: node})});
        });

        it('Should respond to input change events with "changed"', (done, fail) => {
            let widget = ToggleButtonInput.make(testConfig);
            bus.on('sync', () => {
                bus.emit('update', {value: defaultValue});
                TestUtil.wait(200)
                    .then(() => {
                        let inputElem = node.querySelector('input[type="checkbox"]');
                        expect(inputElem.getAttribute('checked')).not.toBeNull();
                        inputElem.dispatchEvent(new Event('change'));
                    })
                    .catch(fail);
            });
            bus.on('changed', (message) => {
                expect(message.newValue).toBeTruthy();
                done();
            });

            widget.start().then(() => {bus.emit('run', {node: node})});
        });

        it('Should respond to input change events with "validation"', (done) => {
            let widget = ToggleButtonInput.make(testConfig);
            bus.on('sync', () => {
                bus.emit('update', {value: defaultValue});
                TestUtil.wait(100)
                    .then(() => {
                        let inputElem = node.querySelector('input[type="checkbox"]');
                        expect(inputElem.getAttribute('checked')).not.toBeNull();
                        inputElem.dispatchEvent(new Event('change'));
                    });
            });
            bus.on('validation', (message) => {
                expect(message.errorMessage).toBeUndefined();
                expect(message.diagnosis).toBe('valid');
                done();
            });

            widget.start().then(() => {bus.emit('run', {node: node})});
        });
    });
})
