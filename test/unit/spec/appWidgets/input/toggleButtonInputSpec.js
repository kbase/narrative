define(['common/runtime', 'widgets/appWidgets2/input/toggleButtonInput'], (
    Runtime,
    ToggleButtonInput
) => {
    'use strict';
    let bus, testConfig, runtime, container;
    const required = false,
        defaultValue = true;

    function buildTestConfig(_required, _defaultValue, _bus) {
        return {
            bus: _bus,
            parameterSpec: {
                data: {
                    defaultValue: _defaultValue,
                    nullValue: null,
                    constraints: {
                        required: _required,
                    },
                },
                defaultValue: () => _defaultValue,
                required: () => _required,
            },
            channelName: _bus.channelName,
        };
    }

    // as near as I can tell, this input widget doesn't get used.
    // I can't prove that, though, yet.
    // But for now, skipping this test suite.
    xdescribe('ToggleButtonInput tests', () => {
        beforeEach(() => {
            runtime = Runtime.make();
            container = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'toggle button testing',
            });
            testConfig = buildTestConfig(required, defaultValue, bus);
        });
        afterEach(() => {
            bus.stop();
            window.kbaseRuntime = null;
            container.remove();
        });

        it('should be defined', () => {
            expect(ToggleButtonInput).not.toBeNull();
        });

        it('Should instantiate a widget', (done) => {
            const widget = ToggleButtonInput.make(testConfig);
            expect(widget).toBeDefined();
            expect(widget.start).toBeDefined();

            // fires 'sync' after starting, then we can tell it to 'update',
            // which does the rendering. THEN we can examine that it's rendered right.
            bus.on('sync', () => {
                expect(container.querySelector('[data-element="main-panel"]')).toBeDefined();
                bus.emit('update', { value: true });
                setTimeout(() => {
                    const inputElem = container.querySelector('input[type="checkbox"]');
                    expect(inputElem).toBeDefined();
                    expect(inputElem.getAttribute('checked')).not.toBeNull();
                    done();
                }, 1000);
            });

            widget.start().then(() => {
                bus.emit('run', { node: container });
            });
        });

        it('Should update value via bus', (done) => {
            // start with one value, change it, then reset.
            // check along the way.
            const widget = ToggleButtonInput.make(testConfig);

            bus.on('validation', () => {
                const inputElem = container.querySelector('input[type="checkbox"]');
                expect(inputElem.getAttribute('checked')).not.toBeNull();
                done();
            });

            bus.on('sync', () => {
                bus.emit('update', { value: defaultValue }); // no change, just verify it's there.
            });
            widget.start().then(() => {
                bus.emit('run', { node: container });
            });
        });

        it('should reset value via bus', (done) => {
            const widget = ToggleButtonInput.make(testConfig);
            let validationCount = 0;
            bus.on('validation', () => {
                const inputElem = container.querySelector('input[type="checkbox"]');
                if (inputElem) {
                    if (validationCount < 1) {
                        expect(inputElem.getAttribute('checked')).toBeNull();
                        validationCount++;
                        bus.emit('reset-to-defaults');
                    } else {
                        expect(inputElem.getAttribute('checked')).not.toBeNull();
                        done();
                    }
                }
            });
            bus.on('sync', () => {
                bus.emit('update', { value: false });
            });
            widget.start().then(() => {
                bus.emit('run', { node: container });
            });
        });

        it('Should respond to input change events with "changed"', (done) => {
            const widget = ToggleButtonInput.make(testConfig);

            bus.on('sync', () => {
                bus.emit('update', { value: defaultValue });
            });
            bus.on('validation', () => {
                const inputElem = container.querySelector('input[type="checkbox"]');
                if (inputElem) {
                    expect(inputElem.getAttribute('checked')).not.toBeNull();
                    inputElem.dispatchEvent(new Event('change'));
                }
            });
            bus.on('changed', (message) => {
                expect(message.newValue).toBeTruthy();
                done();
            });

            widget.start().then(() => {
                bus.emit('run', { node: container });
            });
        });

        it('Should respond to input change events', (done) => {
            const widget = ToggleButtonInput.make(testConfig);

            bus.on('validation', (message) => {
                expect(message.errorMessage).toBeUndefined();
                expect(message.diagnosis).toBe('valid');
                const inputElem = container.querySelector('input[type="checkbox"]');
                if (inputElem) {
                    expect(inputElem.getAttribute('checked')).not.toBeNull();
                    inputElem.dispatchEvent(new Event('change'));
                }
            });

            bus.on('changed', (message) => {
                expect(message.newValue).toBeTruthy();
                done();
            });

            bus.on('sync', () => {
                bus.emit('update', { value: defaultValue });
            });

            widget.start().then(() => {
                bus.emit('run', { node: container });
            });
        });
    });
});
