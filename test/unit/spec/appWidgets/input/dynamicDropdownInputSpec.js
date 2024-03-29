define([
    'jquery',
    'widgets/appWidgets2/input/dynamicDropdownInput',
    'common/runtime',
    'base/js/namespace',
    'narrativeConfig',
    'narrativeMocks',
    'testUtil',
], ($, DynamicDropdownInput, Runtime, Jupyter, Config, Mocks, TestUtil) => {
    'use strict';

    describe('Test dynamic dropdown input widget', () => {
        const CONTROL_SELECTOR = 'select.form-control[data-element="input"]';
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
                description: 'dynamic dropdown testing',
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

        it('should start up and stop correctly', async () => {
            const widget = DynamicDropdownInput.make(testConfig);
            await widget.start({ node: container });
            expect(container.innerHTML).toContain('input-container');
            await widget.stop();
            expect(container.innerHTML).not.toContain('input-container');
        });

        it('should copy an empty string when nothing is selected', async () => {
            const widget = DynamicDropdownInput.make(testConfig);
            await widget.start({ node: container });
            const copyBtn = container.querySelector('button.kb-app-row-clip-btn');
            spyOn(navigator.clipboard, 'writeText');
            copyBtn.click();
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
            await widget.stop();
        });

        describe('Custom data source', () => {
            const service = 'SomeService',
                method = 'some_method',
                nsUrl = 'https://kbase.us/service/fakeNSUrl';
            let customConfig;

            beforeEach(() => {
                customConfig = {
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
            });

            it('should request all parameters over its parent bus before doing a custom lookup', async () => {
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
                const selectElem = container.querySelector(CONTROL_SELECTOR);
                const select2Elem = container.querySelector('span.select2');

                await TestUtil.waitForElementChange(select2Elem, () => {
                    $(selectElem).select2('open');
                    $(selectElem).val('foo').trigger('change');
                });
                await TestUtil.wait(500);
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
                // the options get put as a sibling to the element, because Select2 enjoys that.
                const optionsBoxChildren = document.querySelector(
                    '.select2-results__options'
                ).children;
                const options = document.querySelectorAll('.select2-results__option');
                expect(optionsBoxChildren.length).toBe(3);
                expect(options[1].innerText).toBe('foo value1 bar');
                await widget.stop();
            });

            it('should load with a previous selection showing', async () => {
                const testConfig = TestUtil.JSONcopy(customConfig);
                testConfig.initialValue = 'a_value';
                testConfig.initialDisplayValue = {
                    field: 'Some Value',
                };

                const widget = DynamicDropdownInput.make(testConfig);
                await widget.start({ node: container });

                const selectElem = container.querySelector(CONTROL_SELECTOR);
                expect($(selectElem).select2('data')[0].value).toEqual(testConfig.initialValue);
                const selectedOption = container.querySelector('.kb-appInput__dynDropdown_display');
                expect(selectedOption.innerText).toBe('foo Some Value bar');

                await widget.stop();
            });

            it('should copy the formatted, selected field', async () => {
                const testConfig = TestUtil.JSONcopy(customConfig);
                testConfig.initialValue = 'a_value';
                testConfig.initialDisplayValue = {
                    field: 'Some Value',
                };

                const widget = DynamicDropdownInput.make(testConfig);
                await widget.start({ node: container });

                const copyBtn = container.querySelector('button.kb-app-row-clip-btn');
                spyOn(navigator.clipboard, 'writeText');
                copyBtn.click();
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith('foo Some Value bar');

                await widget.stop();
            });
        });

        describe('Custom data source with exact_match_on', () => {
            const service = 'SomeService',
                method = 'some_search_method',
                nsUrl = 'https://kbase.us/service/fakeNSUrl';
            const parameterSpec = {
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
                        service_params: [],
                        service_version: 'dev',
                        exact_match_on: 'searchField',
                    },
                },
            };

            beforeEach(() => {
                Mocks.mockServiceWizardLookup({
                    module: service,
                    url: nsUrl,
                });
            });

            it('should automatically lookup and populate results when given a value, no display value, and exact_match_on', async () => {
                const initialValue = 'initial value';
                const mockJsonBody = {
                    url: nsUrl,
                    body: new RegExp(`${service}.${method}`),
                    response: [
                        {
                            id: 'first',
                            field: 'value0',
                            searchField: 'some response',
                        },
                        {
                            id: 'second',
                            field: 'value1',
                            searchField: initialValue,
                        },
                        {
                            id: 'third',
                            field: 'value2',
                            searchField: 'another response',
                        },
                    ],
                };
                Mocks.mockJsonRpc1Call(mockJsonBody);

                bus.respond({
                    key: {
                        type: 'get-parameters',
                    },
                    handle: () => {
                        return Promise.resolve({});
                    },
                });

                const widget = DynamicDropdownInput.make({
                    parameterSpec,
                    initialValue,
                    channelName: bus.channelName,
                });
                await widget.start({ node: container });
                const validResponse = mockJsonBody.response[1];
                const selectElem = container.querySelector(CONTROL_SELECTOR);
                const selectedData = $(selectElem).select2('data')[0];
                expect(selectedData.id).toEqual(validResponse.id);
                expect(selectedData.field).toEqual(validResponse.field);
                expect(selectedData.selected).toBeTrue();
                expect(container.querySelector('.select2-selection__rendered').innerText).toContain(
                    `foo ${validResponse.field} bar`
                );
                await widget.stop();
            });

            it('should fail validation when given a value, no display value, exact_match_on is present, and no exact match is found', async () => {
                const initialValue = 'initial value';
                const mockJsonBody = {
                    url: nsUrl,
                    body: new RegExp(`${service}.${method}`),
                    response: [
                        {
                            id: 'first',
                            field: 'value0',
                            searchField: 'some response',
                        },
                        {
                            id: 'second',
                            field: 'value1',
                            searchField: 'not the expectation',
                        },
                        {
                            id: 'third',
                            field: 'value2',
                            searchField: 'another response',
                        },
                    ],
                };
                Mocks.mockJsonRpc1Call(mockJsonBody);

                bus.respond({
                    key: {
                        type: 'get-parameters',
                    },
                    handle: () => {
                        return Promise.resolve({});
                    },
                });

                const widget = DynamicDropdownInput.make({
                    parameterSpec,
                    initialValue,
                    channelName: bus.channelName,
                });

                await new Promise((resolve) => {
                    bus.on('validation', (message) => {
                        expect(message.isValid).toBeFalse();
                        resolve();
                    });
                    return widget.start({ node: container });
                });
                await widget.stop();
            });

            it('should copy the exact_match_on field, regardless of formatting', async () => {
                const initialValue = 'some exact search';
                const mockJsonBody = {
                    url: nsUrl,
                    body: new RegExp(`${service}.${method}`),
                    response: [
                        {
                            id: 'first',
                            field: 'value0',
                            searchField: initialValue,
                        },
                    ],
                };
                Mocks.mockJsonRpc1Call(mockJsonBody);
                const widget = DynamicDropdownInput.make({
                    parameterSpec,
                    initialValue,
                    channelName: bus.channelName,
                });

                bus.respond({
                    key: {
                        type: 'get-parameters',
                    },
                    handle: () => {
                        return Promise.resolve({});
                    },
                });

                await widget.start({ node: container });

                const copyBtn = container.querySelector('button.kb-app-row-clip-btn');
                spyOn(navigator.clipboard, 'writeText');
                copyBtn.click();
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith(initialValue);

                await widget.stop();
            });
        });

        describe('Staging Area dynamic dropdown', () => {
            const stagingServiceUrl = Config.url('staging_api_url');
            const fakeUser = 'someUser';
            const files = [
                {
                    name: 'file1.txt',
                    path: fakeUser + '/file1.txt',
                    mtime: 1532738637400,
                    size: 2048,
                    isFolder: false,
                },
                {
                    name: 'test_folder',
                    path: fakeUser + '/test_folder',
                    mtime: 1532738637499,
                    size: 34,
                    isFolder: true,
                },
                {
                    name: 'file_list.txt',
                    path: fakeUser + '/test_folder/file_list.txt',
                    mtime: 1532738637555,
                    size: 49233,
                    source: 'KBase upload',
                    isFolder: false,
                },
            ];
            let ddStagingConfig;
            beforeEach(() => {
                ddStagingConfig = {
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
                                data_source: 'ftp_staging',
                                multiselection: 0,
                                query_on_empty_input: 1,
                                result_array_index: 0,
                            },
                        },
                    },
                    channelName: bus.channelName,
                };
            });

            async function testWithStagingService(testFiles, displayTexts) {
                jasmine.Ajax.stubRequest(new RegExp(`${stagingServiceUrl}/search/`)).andReturn({
                    status: 200,
                    statusText: 'success',
                    contentType: 'text/plain',
                    responseHeaders: '',
                    responseJSON: testFiles,
                });

                const widget = DynamicDropdownInput.make(ddStagingConfig);
                await widget.start({ node: container });

                const selectElem = container.querySelector(CONTROL_SELECTOR);

                await TestUtil.waitForElementChange(container.querySelector('span.select2'), () => {
                    $(selectElem).select2('open');
                });
                await TestUtil.wait(500);
                const req = jasmine.Ajax.requests.mostRecent();
                expect(req.url).toMatch(stagingServiceUrl + '/search');

                // verify that the dropdown gets populated with results
                const optionsBoxChildren = document.querySelector(
                    '.select2-results__options'
                ).children;
                const options = document.querySelectorAll('.select2-results__option');
                expect(optionsBoxChildren.length).toBe(displayTexts.length);
                options.forEach((option, index) => {
                    expect(option.innerText).toContain(displayTexts[index]);
                });
                await widget.stop();
            }

            it('Should search the staging area and show files', async () => {
                await testWithStagingService(files, [files[0].path, files[2].path]);
            });

            it('Should load with a previously selected file chosen', async () => {
                const config = TestUtil.JSONcopy(ddStagingConfig);
                config.initialValue = 'some_random_file.txt';
                const widget = DynamicDropdownInput.make(config);
                await widget.start({ node: container });

                const selectElem = container.querySelector(CONTROL_SELECTOR);
                expect($(selectElem).select2('data')[0].value).toEqual(config.initialValue);
                await widget.stop();
            });

            it('Should show a "Nothing found" notification if no files are returned', async () => {
                await testWithStagingService([], ['No results found']);
            });

            it('should copy the selected staging file name', async () => {
                const config = TestUtil.JSONcopy(ddStagingConfig);
                config.initialValue = 'some_random_file.txt';
                const widget = DynamicDropdownInput.make(config);
                await widget.start({ node: container });

                const copyBtn = container.querySelector('button.kb-app-row-clip-btn');
                spyOn(navigator.clipboard, 'writeText');
                copyBtn.click();
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith(config.initialValue);
                await widget.stop();
            });
        });
    });
});
