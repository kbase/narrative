define(['common/runtime', 'widgets/appWidgets2/input/selectInput', 'testUtil'], (
    Runtime,
    SelectInput,
    TestUtil
) => {
    'use strict';
    let bus, testConfig, runtime, container;
    const required = false,
        defaultValue = 'apple';

    function buildTestConfig(_required, _defaultValue, _bus) {
        return {
            bus: _bus,
            parameterSpec: {
                data: {
                    defaultValue: _defaultValue,
                    nullValue: '',
                    constraints: {
                        required: _required,
                        defaultValue: _defaultValue,
                        options: [
                            {
                                value: 'apple',
                                display: 'Apple',
                            },
                            {
                                value: 'banana',
                                display: 'Banana',
                            },
                            {
                                value: 'carrot',
                                display: 'Carrot',
                            },
                        ],
                    },
                },
            },
            channelName: _bus.channelName,
            initialValue: 'apple',
        };
    }

    describe('Select Input tests', () => {
        beforeEach(() => {
            runtime = Runtime.make();
            container = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'select input testing',
            });
            testConfig = buildTestConfig(required, defaultValue, bus);
        });

        afterEach(() => {
            bus.stop();
            runtime.destroy();
            container.remove();
            TestUtil.clearRuntime();
        });

        it('should be defined', () => {
            expect(SelectInput).not.toBeNull();
        });

        it('should be instantiable', () => {
            const widget = SelectInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('Should start and stop a widget', () => {
            const widget = SelectInput.make(testConfig);

            return widget
                .start({ node: container })
                .then(() => {
                    // verify it's there.
                    const inputElem = container.querySelector('select[data-element="input"]');
                    expect(inputElem).toBeDefined();
                    return widget.stop();
                })
                .then(() => {
                    // verify it's gone.
                    expect(container.childElementCount).toBe(0);
                });
        });

        it('Should update value via bus', () => {
            // select one value then update it.
            const widget = SelectInput.make(testConfig);
            return widget.start({ node: container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeTruthy();
                        resolve();
                    });
                    bus.emit('update', { value: 'banana' });
                });
            });
        });

        it('Should reset to default via bus', () => {
            const widget = SelectInput.make(testConfig);
            return widget.start({ node: container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeTruthy();
                        resolve();
                    });
                    bus.emit('reset-to-defaults');
                });
            });
        });

        it('Should respond to input change events with "changed"', () => {
            const widget = SelectInput.make(testConfig);
            return widget.start({ node: container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('changed', (message) => {
                        expect(message.newValue).toEqual('banana');
                        resolve();
                    });
                    const inputElem = container.querySelector('select[data-element="input"]');
                    inputElem.selectedIndex = 1;
                    inputElem.dispatchEvent(new Event('change'));
                });
            });
        });

        it('Should respond to input change events with "validation"', () => {
            const widget = SelectInput.make(testConfig);
            return widget.start({ node: container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeTruthy();
                        expect(message.errorMessage).toBeUndefined();
                        resolve();
                    });
                    const inputElem = container.querySelector('select[data-element="input"]');
                    inputElem.selectedIndex = 1;
                    inputElem.dispatchEvent(new Event('change'));
                });
            });
        });

        it('Should show message when configured', () => {
            testConfig.showOwnMessages = true;
            const widget = SelectInput.make(testConfig);
            return widget.start({ node: container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeTruthy();
                        // ...detect something?
                        resolve();
                    });
                    const inputElem = container.querySelector('select[data-element="input"]');
                    inputElem.selectedIndex = 1;
                    inputElem.dispatchEvent(new Event('change'));
                });
            });
        });

        it('Should return a diagnosis of required-missing if so', () => {
            bus = runtime.bus().makeChannelBus();
            testConfig = buildTestConfig(true, '', bus);
            const widget = SelectInput.make(testConfig);
            return widget.start({ node: container }).then(() => {
                return new Promise((resolve, reject) => {
                    let msgCount = 0,
                        okCount = 0;
                    bus.on('validation', (message) => {
                        msgCount++;
                        if (message.isValid) {
                            okCount++;
                        }
                        if (msgCount === 2) {
                            if (okCount > 1) {
                                reject('too many ok messages');
                            }
                        }
                        if (!message.isValid) {
                            expect(message.diagnosis).toBe('required-missing');
                            resolve();
                        }
                    });
                    const inputElem = container.querySelector('select[data-element="input"]');
                    inputElem.selectedIndex = -1;
                    inputElem.dispatchEvent(new Event('change'));
                });
            });
        });

        it('Should take a list of disabledValues on startup', () => {
            const config = Object.assign({}, testConfig, { disabledValues: ['carrot'] });
            const widget = SelectInput.make(config);

            return widget.start({ node: container }).then(() => {
                // verify it's there.
                const inputElem = container.querySelector('select[data-element="input"]');
                const carrotItem = inputElem.querySelector('option[value="carrot"]');
                expect(carrotItem.hasAttribute('disabled')).toBeTrue();
                const bananaItem = inputElem.querySelector('option[value="banana"]');
                expect(bananaItem.hasAttribute('disabled')).toBeFalse();
            });
        });

        function checkItems(expectedStates, inputElem) {
            Object.keys(expectedStates).forEach((item) => {
                const elem = inputElem.querySelector(`option[value="${item}"]`);
                expect(elem.hasAttribute('disabled')).toBe(expectedStates[item]);
            });
        }

        it('Should obey a message to disable selection options', async () => {
            const widget = SelectInput.make(testConfig);

            await widget.start({ node: container });
            // verify it's there and the initial item states are all enabled (i.e. not disabled)
            const itemsDisabled = {
                apple: false,
                banana: false,
                carrot: false,
            };
            const inputElem = container.querySelector('select[data-element="input"]');
            checkItems(itemsDisabled, inputElem);

            const carrotItem = inputElem.querySelector('option[value="carrot"]');
            await TestUtil.waitForElementChange(carrotItem, () => {
                bus.emit('set-disabled-values', {
                    values: ['carrot'],
                });
            });
            itemsDisabled.carrot = true;
            checkItems(itemsDisabled, inputElem);
        });

        it('Should take a set of options that override the options from the parameter spec', () => {
            const values = [
                {
                    display: 'Dirigible',
                    value: 'dirigible',
                },
                {
                    display: 'Elephant',
                    value: 'elephant',
                },
                {
                    display: 'Frittata',
                    value: 'frittata',
                },
            ];
            const config = Object.assign({}, testConfig, {
                availableValues: values,
                initialValue: 'elephant',
            });
            const widget = SelectInput.make(config);
            return widget.start({ node: container }).then(() => {
                const inputElem = container.querySelector('select[data-element="input"]');
                expect(inputElem.value).toEqual('elephant');
                expect(inputElem.childElementCount).toBe(3);
                for (const child of inputElem.children) {
                    expect(['dirigible', 'elephant', 'frittata'].includes(child.value)).toBeTrue();
                }
            });
        });
    });
});
