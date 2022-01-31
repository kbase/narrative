define([
    'jquery',
    'widgets/appWidgets2/input/dynamicDropdownInput',
    'common/runtime',
    'base/js/namespace',
    'narrativeMocks',
    'testUtil',
], ($, DynamicDropdownInput, Runtime, Jupyter, Mocks, TestUtil) => {
    'use strict';

    describe('Test dynamic dropdown input widget', () => {
        const testConfig = {
                parameterSpec: {
                    data: {
                        defaultValue: '',
                        nullValue: '',
                        constraints: {
                            required: false,
                        },
                    },
                    original: {
                        dynamic_dropdown_options: {},
                    },
                },
            },
            AUTH_TOKEN = 'fakeAuthToken';
        let container, runtime, bus;

        beforeEach(() => {
            jasmine.Ajax.install();
            container = document.createElement('div');
            runtime = Runtime.make();
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                userId: 'test_user',
            };
            bus = runtime.bus().makeChannelBus({
                description: 'float testing',
            });
            testConfig.channelName = bus.channelName;
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            container.remove();
            bus.stop();
            Mocks.clearAuthToken();
            Jupyter.narrative = null;
            TestUtil.clearRuntime();
        });

        it('should be defined', () => {
            expect(DynamicDropdownInput).not.toBeNull();
        });

        it('should instantiate with a test config', () => {
            const widget = DynamicDropdownInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start up and stop correctly', () => {
            const widget = DynamicDropdownInput.make(testConfig);
            return widget
                .start({ node: container })
                .then(() => {
                    expect(container.innerHTML).toContain('input-container');
                    return widget.stop();
                })
                .then(() => {
                    expect(container.innerHTML).not.toContain('input-container');
                });
        });

        it('should request all parameters over its parent bus before doing a custom lookup', async () => {
            const service = 'SomeService';
            const method = 'some_method';
            const nsUrl = 'https://kbase.us/service/fakeNSUrl';
            const customConfig = {
                parameterSpec: {
                    data: {
                        defaultValue: '',
                        nullValue: '',
                        constraints: {
                            required: false,
                        },
                    },
                    original: {
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
                },
                channelName: bus.channelName,
            };

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

            const widget = DynamicDropdownInput.make(customConfig);
            await widget.start({ node: container });
            expect(container.innerHTML).toContain('input-container');
            const selector = 'select.form-control[data-element="input"]';
            const selectElem = container.querySelector(selector);
            const select2Elem = container.querySelector('span.select2');

            await TestUtil.waitForElementChange(select2Elem, () => {
                $(selectElem).select2('open');
                $(selectElem).val('foo').trigger('change');
            });
            await TestUtil.wait(1000);
            const req = jasmine.Ajax.requests.mostRecent();
            expect(req.url).toBe(nsUrl);
            // the client used here sends request payloads as text, which gets form encoded, which is silly and should be
            // updated to use application/json. But that's later. For now, unpack it for checking.
            const data = JSON.parse(Object.keys(req.data())[0]);
            expect(data.params).toEqual([{ some_param: 'banana' }]);
            expect(data.method).toEqual(`${service}.${method}`);

            // verify that the bus was called exactly once
            expect(busResponseCalls).toBe(1);

            // verify that the dropdown gets populated with results
            const optionsBoxChildren = document.querySelector('.select2-results__options').children;
            const options = document.querySelectorAll('.select2-results__option');
            expect(optionsBoxChildren.length).toBe(3);
            expect(options[1].innerText).toBe('foo value1 bar');
        });
    });
});
