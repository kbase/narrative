define([
    'jquery',
    'common/runtime',
    'widgets/appWidgets2/input/selectInput',
    'testUtil',
    'widgets/appWidgets2/validators/constants',
], ($, Runtime, SelectInput, TestUtil, Constants) => {
    'use strict';
    let bus, runtime;

    const dropdownOptions = [
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
    ];

    const badOption = 'a very bad option';

    function buildTestConfig(args) {
        const singleConfig = {
                multiselection: 0,
                defaultValue: 'apple',
                initialValue: 'apple',
                nullValue: '',
            },
            multiConfig = {
                multiselection: 1,
                defaultValue: ['apple'],
                initialValue: ['apple'],
                nullValue: [],
            },
            baseConfig = args.multiselection ? multiConfig : singleConfig;

        const config = {
            ...baseConfig,
            required: false,
            ...args,
        };

        return {
            devMode: true,
            bus: config.bus,
            parameterSpec: {
                data: {
                    defaultValue: config.defaultValue,
                    nullValue: config.nullValue,
                    constraints: {
                        required: config.required,
                        options: args.options || dropdownOptions,
                    },
                    type: 'string',
                },
                ui: {
                    label: 'A select input',
                },
                original: {
                    dropdown_options: {
                        multiselection: config.multiselection,
                        options: args.options || dropdownOptions,
                    },
                },
            },
            channelName: config.bus.channelName,
            initialValue: config.initialValue,
        };
    }

    describe('The Select input', () => {
        beforeEach(function () {
            runtime = Runtime.make();
            bus = runtime.bus().makeChannelBus({
                description: 'select input testing',
            });
            this.container = document.createElement('div');
            this.testConfig = buildTestConfig({ bus });
        });

        afterEach(() => {
            bus.stop();
            runtime.destroy();
            TestUtil.clearRuntime();
        });

        it('should be defined', () => {
            expect(SelectInput).not.toBeNull();
        });

        it('should be instantiable', function () {
            const widget = SelectInput.make(this.testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('Should start and stop a widget', function () {
            const widget = SelectInput.make(this.testConfig);

            return widget
                .start({ node: this.container })
                .then(() => {
                    // verify it's there.
                    const inputElem = this.container.querySelector('select[data-element="input"]');
                    expect(inputElem).toBeDefined();
                    return widget.stop();
                })
                .then(() => {
                    // verify it's gone.
                    expect(this.container.childElementCount).toBe(0);
                });
        });

        describe('bus updates', () => {
            it('Should update value via bus', async function () {
                // select one value then update it.
                const widget = SelectInput.make(this.testConfig);
                await widget.start({ node: this.container });
                const inputElem = this.container.querySelector('select[data-element="input"]');
                expect($(inputElem).val()).toEqual(this.testConfig.parameterSpec.data.defaultValue);

                bus.emit('update', { value: 'banana' });
                return new Promise((resolve) => {
                    bus.on('set-value', (msg) => {
                        expect(msg).toEqual('banana');
                        expect($(inputElem).val()).toEqual('banana');
                        resolve();
                    });
                });
            });

            it('Should reset to default via bus', async function () {
                const widget = SelectInput.make(this.testConfig, { initialValue: 'carrot' });
                await widget.start({ node: this.container });
                const inputElem = this.container.querySelector('select[data-element="input"]');

                bus.emit('reset-to-defaults');
                return new Promise((resolve) => {
                    bus.on('set-value', (msg) => {
                        expect(msg).toEqual(this.testConfig.parameterSpec.data.defaultValue);
                        expect($(inputElem).val()).toEqual(
                            this.testConfig.parameterSpec.data.defaultValue
                        );
                        resolve();
                    });
                });
            });
        });

        describe('change events', () => {
            it('Should respond to input change events with "changed" and "validation" messages, single select', async function () {
                const widget = SelectInput.make(this.testConfig);
                let startUpVal = false;
                await widget.start({ node: this.container });
                return new Promise((resolve) => {
                    bus.on('validation', (msg) => {
                        if (!startUpVal) {
                            // start up validation
                            const startUpExpected = {
                                isValid: true,
                                parsedValue: 'apple',
                            };
                            expect(msg).toEqual(jasmine.objectContaining(startUpExpected));
                            startUpVal = true;
                            return;
                        }
                        const expected = {
                            isValid: true,
                            diagnosis: 'valid',
                            parsedValue: 'banana',
                        };
                        expect(msg).toEqual(jasmine.objectContaining(expected));
                        resolve();
                    });
                    bus.on('changed', (message) => {
                        expect(message.newValue).toEqual('banana');
                    });
                    const inputElem = this.container.querySelector('select[data-element="input"]');
                    $(inputElem).val('banana').trigger('change');
                });
            });

            it('Should respond to input change events with "changed" and "validation" messages, multi select', async function () {
                this.testConfig = buildTestConfig({ multiselection: 1, bus });
                const widget = SelectInput.make(this.testConfig);
                let startUpVal = false;
                await widget.start({ node: this.container });
                return new Promise((resolve) => {
                    bus.on('validation', (msg) => {
                        if (!startUpVal) {
                            // start up validation
                            const startUpExpected = {
                                isValid: true,
                                parsedValue: ['apple'],
                            };
                            expect(msg).toEqual(jasmine.objectContaining(startUpExpected));
                            startUpVal = true;
                            return;
                        }
                        const expected = {
                            isValid: true,
                            diagnosis: 'valid',
                            parsedValue: ['apple', 'carrot'],
                        };
                        expect(msg).toEqual(jasmine.objectContaining(expected));
                        resolve();
                    });
                    bus.on('changed', (message) => {
                        expect(message.newValue).toEqual(['apple', 'carrot']);
                    });
                    const inputElem = this.container.querySelector('select[data-element="input"]');
                    $(inputElem).val(['apple', 'carrot']).trigger('change');
                });
            });
        });

        describe('start up, selections required', () => {
            async function runRequiredTest(ctx) {
                const widget = SelectInput.make(ctx.testConfig);
                await widget.start({ node: ctx.container });
                return new Promise((resolve, reject) => {
                    let msgCount = 0,
                        okCount = 0;
                    ctx.bus.on('validation', (message) => {
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
                            expect(message.diagnosis).toBe(Constants.DIAGNOSIS.REQUIRED_MISSING);
                            expect(message.errorMessage).toBe('A value is required.');
                            resolve();
                        }
                    });
                    const inputElem = ctx.container.querySelector('select[data-element="input"]');
                    inputElem.selectedIndex = -1;
                    inputElem.dispatchEvent(new Event('change'));
                });
            }

            it('Should return a diagnosis of required-missing if empty', function () {
                this.bus = runtime.bus().makeChannelBus();
                this.testConfig = buildTestConfig({
                    required: true,
                    defaultValue: '',
                    bus: this.bus,
                });
                return runRequiredTest(this);
            });

            it('Should return a diagnosis of required-missing if empty, multiselect', function () {
                this.bus = runtime.bus().makeChannelBus();
                this.testConfig = buildTestConfig({
                    required: true,
                    initialValue: [],
                    bus: this.bus,
                    multiselection: 1,
                });
                return runRequiredTest(this);
            });
        });

        it('Should show the user a specific error if the given option is not one of the allowed ones', function () {
            bus = runtime.bus().makeChannelBus();
            this.testConfig = buildTestConfig({
                required: true,
                defaultValue: '',
                initialValue: badOption,
                bus,
            });
            const widget = SelectInput.make(this.testConfig);
            return widget.start({ node: this.container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeFalse();
                        expect(message.diagnosis).toBe(Constants.DIAGNOSIS.INVALID);
                        expect(message.errorMessage).toBe(
                            `Invalid ${this.testConfig.parameterSpec.ui.label}: ${badOption}. Please select a value from the dropdown.`
                        );
                        resolve();
                    });
                });
            });
        });

        it('Should show the user a specific error if the given option is the wrong format, multiselect', function () {
            bus = runtime.bus().makeChannelBus();
            this.testConfig = buildTestConfig({
                required: true,
                initialValue: badOption,
                bus,
                multiselection: 1,
            });
            const widget = SelectInput.make(this.testConfig);
            return widget.start({ node: this.container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeFalse();
                        expect(message.diagnosis).toBe(Constants.DIAGNOSIS.INVALID);
                        expect(message.errorMessage).toBe('Invalid format: value must be an array');
                        resolve();
                    });
                });
            });
        });

        it('Should show the user a specific error if the given option is not one of the allowed ones, multiselect', function () {
            bus = runtime.bus().makeChannelBus();
            this.testConfig = buildTestConfig({
                required: true,
                initialValue: [badOption],
                bus,
                multiselection: 1,
            });
            const widget = SelectInput.make(this.testConfig);
            return widget.start({ node: this.container }).then(() => {
                return new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeFalse();
                        expect(message.diagnosis).toBe(Constants.DIAGNOSIS.INVALID);
                        expect(message.errorMessage).toBe(
                            'Invalid value. Please select a value from the dropdown.'
                        );
                        resolve();
                    });
                });
            });
        });

        it('Should take a list of disabledValues on startup', function () {
            const config = Object.assign({}, this.testConfig, { disabledValues: ['carrot'] });
            const widget = SelectInput.make(config);

            return widget.start({ node: this.container }).then(() => {
                // verify it's there.
                const inputElem = this.container.querySelector('select[data-element="input"]');
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

        it('Should obey a message to disable selection options', async function () {
            const widget = SelectInput.make(this.testConfig);

            await widget.start({ node: this.container });
            // verify it's there and the initial item states are all enabled (i.e. not disabled)
            const itemsDisabled = {
                apple: false,
                banana: false,
                carrot: false,
            };
            const inputElem = this.container.querySelector('select[data-element="input"]');
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

        it('Should take a set of options that override the options from the parameter spec', function () {
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
            const config = Object.assign({}, this.testConfig, {
                availableValues: values,
                initialValue: 'elephant',
            });
            const widget = SelectInput.make(config);
            return widget.start({ node: this.container }).then(() => {
                const inputElem = this.container.querySelector('select[data-element="input"]');
                expect(inputElem.value).toEqual('elephant');
                expect(inputElem.childElementCount).toBe(3);
                for (const child of inputElem.children) {
                    expect(['dirigible', 'elephant', 'frittata'].includes(child.value)).toBeTrue();
                }
            });
        });

        describe('copying', () => {
            [
                {
                    initialValue: 'apple',
                    expected: 'Apple',
                },
                {
                    initialValue: 'banana',
                    expected: 'Banana',
                },
                {
                    initialValue: 'nope',
                    expected: '',
                },
                {
                    initialValue: null,
                    expected: '',
                },
            ].forEach((testCase) => {
                it(`Should copy the display text of the currently selected option "${testCase.initialValue}"`, async function () {
                    const widget = SelectInput.make({
                        ...this.testConfig,
                        initialValue: testCase.initialValue,
                    });
                    await widget.start({ node: this.container });

                    const copyBtn = this.container.querySelector('button.kb-app-row-clip-btn');
                    spyOn(navigator.clipboard, 'writeText');
                    copyBtn.click();
                    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testCase.expected);
                });
            });

            [
                {
                    initialValue: ['apple'],
                    expected: 'Apple',
                },
                {
                    initialValue: ['apple', 'banana', 'carrot'],
                    expected: 'Apple, Banana, Carrot',
                },
                {
                    initialValue: ['yep', 'nope'],
                    expected: '',
                },
                {
                    initialValue: [null],
                    expected: '',
                },
            ].forEach((testCase) => {
                it(`Should copy the display text of the currently selected options "${testCase.initialValue}", multiselect`, async function () {
                    this.testConfig = buildTestConfig({
                        bus,
                        multiselection: 1,
                        initialValue: testCase.initialValue,
                    });
                    const widget = SelectInput.make(this.testConfig);
                    await widget.start({ node: this.container });

                    const copyBtn = this.container.querySelector('button.kb-app-row-clip-btn');
                    spyOn(navigator.clipboard, 'writeText');
                    copyBtn.click();
                    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testCase.expected);
                });
            });
        });

        describe('handling a ton of options', () => {
            const NUM_OPTIONS = 30;
            const manyDropdownOptions = Array.from(Array(30), (_v, k) => ({
                value: `val_${k}`,
                display: `Display ${k}`,
            }));
            const initialSelected = manyDropdownOptions[0];

            beforeEach(function () {
                this.testConfig.availableValues = manyDropdownOptions;
                this.testConfig.initialValue = initialSelected.value;
            });

            async function verifyOptions(container) {
                const inputElem = container.querySelector('select[data-element="input"]');
                const select2Elem = container.querySelector('.select2');
                await TestUtil.waitForElementChange(select2Elem, () =>
                    $(inputElem).select2('open')
                );
                // verify that the dropdown gets populated with results
                const options = document.querySelector('.select2-results__options').children;
                expect(options.length).toBe(NUM_OPTIONS);
                for (let i = 0; i < options.length; i++) {
                    expect(options[i].innerText).toContain(manyDropdownOptions[i].display);
                }
            }

            it('should start with a single, selected option in the DOM', async function () {
                const widget = SelectInput.make(this.testConfig);
                await widget.start({ node: this.container });
                const inputElem = this.container.querySelector('select[data-element="input"]');
                expect(inputElem.childElementCount).toBe(1);
                const option = inputElem.children[0];
                expect(option.value).toEqual(initialSelected.value);
                expect(option.innerText).toEqual(initialSelected.display);
                expect(inputElem.value).toEqual(initialSelected.value);
                await verifyOptions(this.container);
                await widget.stop();
            });

            it(`should show ${NUM_OPTIONS} available in the dropdown`, async function () {
                const widget = SelectInput.make(this.testConfig);
                await widget.start({ node: this.container });
                await verifyOptions(this.container);
                await widget.stop();
            });

            [null, undefined].forEach((initVal) => {
                it(`can start with an empty initial value and see all possibilities`, async function () {
                    this.testConfig.initialValue = initVal;
                    const widget = SelectInput.make(this.testConfig);
                    await widget.start({ node: this.container });
                    const inputElem = this.container.querySelector('select[data-element="input"]');
                    expect(inputElem.childElementCount).toBe(0);
                    await verifyOptions(this.container);
                    await widget.stop();
                });
            });
        });
    });
});
