define([
    'jquery',
    'widgets/appWidgets2/input/structInput',
    'base/js/namespace',
    'narrativeMocks',
    'testUtil',
    'common/runtime',
], ($, StructInput, Jupyter, Mocks, TestUtil, Runtime) => {
    'use strict';

    function simpleParamSpec(paramId, defaultVal) {
        const label = `param ${paramId}`,
            hint = `simple test for ${paramId}`;
        return {
            id: paramId,
            multipleItems: false,
            ui: {
                label,
                hint,
                description: '',
                class: 'parameter',
                type: 'string',
                control: 'text',
                advanced: false,
            },
            data: {
                type: 'string',
                sequence: false,
                constraints: {
                    required: false,
                },
                defaultValue: [defaultVal],
                nullValue: null,
            },
            original: {
                id: paramId,
                ui_name: label,
                short_hint: hint,
                description: '',
                field_type: 'text',
                allow_multiple: 0,
                optional: 1,
                advanced: 0,
                disabled: 0,
                ui_class: 'parameter',
                default_values: [defaultVal],
                text_options: {},
            },
        };
    }

    describe('Struct Input Widget', () => {
        const paramA = 'paramA',
            paramB = 'paramB',
            simpleLayout = [paramA, paramB],
            initialValue = {
                [paramA]: 'a',
                [paramB]: 'b',
            },
            zeroValue = {
                [paramA]: '',
                [paramB]: '',
            },
            simpleSpecs = {
                [paramA]: simpleParamSpec(paramA, 'parameter a'),
                [paramB]: simpleParamSpec(paramB, 'parameter b'),
            };
        const AUTH_TOKEN = 'fakeAuthToken';
        let container, runtime, bus, paramsBus, testConfig;

        beforeEach(() => {
            jasmine.Ajax.install();
            container = document.createElement('div');
            document.body.append(container);
            runtime = Runtime.make();
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                userId: 'test_user',
            };
            bus = runtime.bus().makeChannelBus({
                description: 'struct input testing',
            });
            paramsBus = runtime.bus().makeChannelBus({
                description: 'params bus test',
            });

            testConfig = {
                parameterSpec: {
                    id: 'someParamStruct',
                    multipleItems: false,
                    data: {
                        type: 'struct',
                        defaultValue: initialValue,
                        nullValue: null,
                        zeroValue,
                        constraints: {
                            required: false,
                        },
                    },
                    ui: {
                        label: 'param group',
                        description: '',
                        hint: 'a param group',
                        class: 'parameter',
                        control: '',
                        layout: TestUtil.JSONcopy(simpleLayout),
                        advanced: false,
                    },
                    parameters: {
                        layout: TestUtil.JSONcopy(simpleLayout),
                        specs: simpleSpecs,
                    },
                },
                initialValue,
            };
            testConfig.paramsChannelName = paramsBus.channelName;
            testConfig.bus = bus;
            testConfig.channelName = bus.channelName;
        });

        afterEach(() => {
            container.remove();
            Mocks.clearAuthToken();
            Jupyter.narrative = null;
            bus.stop();
            TestUtil.clearRuntime();
            jasmine.Ajax.uninstall();
        });

        it('should be defined', () => {
            expect(StructInput).not.toBeNull();
        });

        it('should instantiate with a test config', () => {
            const widget = StructInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start and stop as expected', async () => {
            const widget = StructInput.make(testConfig);
            await widget.start({ node: container });
            // marker for the two simple test parameter rows
            expect(container.querySelectorAll('.kb-app-parameter-row').length).toEqual(2);
            await widget.stop();
            expect(container.innerHTML).toBe('');
        });

        it('should use a dynamic dropdown and propagate a get-parameters bus message', async () => {
            const service = 'SomeService';
            const method = 'some_method';
            const nsUrl = 'https://kbase.us/service/fakeNSUrl';

            Mocks.mockServiceWizardLookup({
                module: service,
                url: nsUrl,
            });

            const mockJsonBody = {
                url: nsUrl,
                body: new RegExp(`${service}.${method}`),
                response: [
                    {
                        field: 'value0',
                    },
                    {
                        field: 'value1',
                    },
                    {
                        field: 'value2',
                    },
                ],
            };
            Mocks.mockJsonRpc1Call(mockJsonBody);

            const ddId = 'dynamic_dropdown_param',
                label = 'Test dyn drop param',
                hint = 'A dynamic dropdown';
            const dynDropSpec = {
                id: ddId,
                multipleItems: false,
                ui: {
                    label,
                    hint,
                    description: '',
                    class: 'parameter',
                    type: 'dynamic_dropdown',
                    control: 'dynamic_dropdown',
                    advanced: false,
                },
                data: {
                    type: 'string',
                    sequence: false,
                    constraints: {
                        required: false,
                        min_length: 1,
                        max_length: 10000,
                    },
                    nullValue: '',
                    defaultValue: '',
                },
                original: {
                    id: ddId,
                    ui_name: label,
                    short_hint: hint,
                    description: '',
                    field_type: 'dynamic_dropdown',
                    allow_multiple: 0,
                    optional: 1,
                    advanced: 0,
                    disabled: 0,
                    ui_class: 'parameter',
                    default_values: [''],
                    dynamic_dropdown_options: {
                        data_source: 'custom',
                        description_template: 'foo {{field}} bar',
                        multiselection: 0,
                        query_on_empty_input: 1,
                        result_array_index: 0,
                        selection_id: 'field',
                        service_function: `${service}.${method}`,
                        service_params: [
                            {
                                some_param: '{{other_param}}',
                            },
                        ],
                        service_version: 'dev',
                    },
                },
            };

            let busResponseCalls = 0;
            bus.respond({
                key: {
                    type: 'get-parameters',
                },
                handle: (message) => {
                    expect(message).toEqual({});
                    busResponseCalls++;
                    return Promise.resolve({
                        unused_param: null,
                        other_param: 'banana',
                        third_param: 'apple',
                    });
                },
            });

            // add the dynamic dropdown as the third part of the struct
            testConfig.parameterSpec.data.defaultValue[ddId] = '';
            testConfig.parameterSpec.data.zeroValue[ddId] = '';
            testConfig.parameterSpec.ui.layout.push(ddId);
            testConfig.parameterSpec.parameters.layout.push(ddId);
            testConfig.parameterSpec.parameters.specs[ddId] = dynDropSpec;
            testConfig.initialValue[ddId] = 'some_dd_value';

            const widget = StructInput.make(testConfig);
            await widget.start({ node: container });
            // marker for the two simple test parameter rows
            expect(container.querySelectorAll('.kb-app-parameter-row').length).toEqual(3);
            const ddItem = container
                .querySelectorAll('div[data-element="subcontrols"] .kb-app-parameter-row')
                .item(2);

            const selector = 'select.form-control[data-element="input"]';
            const selectElem = ddItem.querySelector(selector);
            const select2Elem = ddItem.querySelector('span.select2');

            await TestUtil.waitForElementChange(select2Elem, () => {
                $(selectElem).select2('open');
                $(selectElem).val('foo').trigger('change');
            });

            await TestUtil.wait(1000);
            const req = jasmine.Ajax.requests.mostRecent();
            expect(req.url).toBe(nsUrl);

            // verify that the bus was called exactly once
            expect(busResponseCalls).toBe(1);

            await widget.stop();
        });
    });
});
