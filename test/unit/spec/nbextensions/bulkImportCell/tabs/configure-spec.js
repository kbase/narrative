define([
    '/narrative/nbextensions/bulkImportCell/tabs/configure',
    'base/js/namespace',
    'common/runtime',
    'common/props',
    'common/spec',
    'testUtil',
    '/test/data/testBulkImportObj',
], (ConfigureTab, Jupyter, Runtime, Props, Spec, TestUtil, TestBulkImportObject) => {
    'use strict';

    describe('test the bulk import cell configure tab', () => {
        const appId = 'kb_uploadmethods/import_fastq_sra_as_reads_from_staging',
            typesToFiles = {
                fastq_reads: {
                    appId,
                    files: ['file1', 'file2'],
                },
            },
            appSpec = Spec.make({
                appSpec: TestBulkImportObject.app.specs[appId],
            }),
            specs = {},
            fakeUser = 'aFakeUser';
        let bus, container, initialState, runtime;

        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
            specs[appId] = appSpec;
        });

        beforeEach(() => {
            runtime = Runtime.make();
            const stagingServiceUrl = runtime.config('services.staging_api_url.url');
            jasmine.Ajax.install();
            // lifted from the used files in this test spec
            const allFakeFiles = [
                'file1.txt',
                'file1',
                'file2',
                'file3',
                'file4',
                'fastq_fwd_1',
                'fastq_fwd_2',
            ];
            const fakeStagingResponse = allFakeFiles.map((fileName) => {
                return {
                    name: fileName,
                    path: fakeUser + '/' + fileName,
                    mtime: 1532738637499,
                    size: 34,
                    isFolder: false,
                };
            });

            jasmine.Ajax.stubRequest(new RegExp(`${stagingServiceUrl}/list/`)).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify(fakeStagingResponse),
            });

            bus = runtime.bus();
            container = document.createElement('div');
            initialState = {
                state: 'editingIncomplete',
                params: {
                    fastq_reads: 'incomplete',
                },
                selectedFileType: 'fastq_reads',
            };
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            container.remove();
            runtime.destroy();
        });

        afterAll(() => {
            Jupyter.narrative = null;
            TestUtil.clearRuntime();
        });

        [
            {
                widget: ConfigureTab,
                viewOnly: false,
                label: 'default',
            },
            {
                widget: ConfigureTab.editMode,
                viewOnly: false,
                label: 'edit',
            },
            {
                widget: ConfigureTab.viewMode,
                viewOnly: true,
                label: 'view',
            },
        ].forEach((testCase) => {
            it(`should start in ${testCase.label} mode`, () => {
                const model = Props.make({
                    data: Object.assign({}, TestBulkImportObject, { state: initialState }),
                    onUpdate: () => {
                        /* intentionally left blank */
                    },
                });
                const configure = testCase.widget.make({
                    bus,
                    model,
                    specs,
                    typesToFiles,
                });

                return configure
                    .start({
                        node: container,
                    })
                    .then(() => {
                        // just make sure it renders the "File Paths" and "Parameters" headers
                        expect(container.innerHTML).toContain('Parameters');
                        expect(container.innerHTML).toContain('File Paths');
                        const inputForm = container.querySelector(
                            '[data-parameter="import_type"] select[data-element="input"]'
                        );
                        expect(inputForm.hasAttribute('readonly')).toBe(testCase.viewOnly);
                        return configure.stop();
                    });
            });
        });

        it('should stop itself and empty the node it was in', () => {
            const model = Props.make({
                data: Object.assign({}, TestBulkImportObject, { state: initialState }),
                onUpdate: () => {
                    /* intentionally left blank */
                },
            });
            const configure = ConfigureTab.make({
                bus,
                model,
                specs,
                typesToFiles,
            });

            return configure
                .start({
                    node: container,
                })
                .then(() => {
                    // just make sure it renders the "File Paths" and "Parameters" headers
                    expect(container.innerHTML).toContain('Parameters');
                    return configure.stop();
                })
                .then(() => {
                    expect(container.innerHTML).toEqual('');
                });
        });

        describe('validation tests', () => {
            async function expectErrorMessage(selector, error) {
                await TestUtil.waitForElementState(container, () => {
                    return !container.querySelector(selector).classList.contains('hidden');
                });
                expect(container.querySelector(selector).innerHTML).toContain(error);
            }

            it('should start with invalid inputs and show errors', async () => {
                const modelData = Object.assign({}, TestBulkImportObject, { state: initialState });
                modelData.params.fastq_reads.filePaths[0].name = null;

                const model = Props.make({
                    data: modelData,
                    onUpdate: () => {
                        /* intentionally left blank */
                    },
                });

                const configure = ConfigureTab.make({
                    bus,
                    model,
                    specs,
                    typesToFiles,
                });

                const paramErrorSelector = '[data-parameter="name"] .kb-field-cell__message_panel';
                await configure.start({ node: container });
                await expectErrorMessage(paramErrorSelector, 'required');
                await configure.stop();
            });

            it('should start with missing files and show errors', async () => {
                const stagingServiceUrl = runtime.config('services.staging_api_url.url');
                jasmine.Ajax.stubRequest(new RegExp(`${stagingServiceUrl}/list/`)).andReturn({
                    status: 200,
                    statusText: 'success',
                    contentType: 'text/plain',
                    responseHeaders: '',
                    responseText: JSON.stringify([]),
                });

                const modelData = Object.assign({}, TestBulkImportObject, { state: initialState });
                modelData.params.fastq_reads.filePaths[0].fastq_fwd_staging_file_name = 'file1';

                const model = Props.make({
                    data: modelData,
                    onUpdate: () => {
                        /* intentionally left blank */
                    },
                });

                const configure = ConfigureTab.make({
                    bus,
                    model,
                    specs,
                    typesToFiles,
                });

                const paramErrorSelector =
                    '[data-parameter="fastq_fwd_staging_file_name"] .kb-field-cell__message_panel';
                await configure.start({ node: container });
                await expectErrorMessage(paramErrorSelector, 'file not found');
                await configure.stop();
            });
        });

        describe('multi-data-type tests', () => {
            beforeEach(function () {
                initialState = {
                    state: 'editingIncomplete',
                    params: {
                        dataType1: 'incomplete',
                        dataType2: 'incomplete',
                    },
                    selectedFileType: 'dataType1',
                };
                const modelData = Object.assign({}, TestBulkImportObject, { state: initialState });
                ['dataType1', 'dataType2'].forEach((dataType) => {
                    modelData.app.fileParamIds[dataType] = modelData.app.fileParamIds.fastq_reads;
                    modelData.app.otherParamIds[dataType] = modelData.app.otherParamIds.fastq_reads;
                    modelData.app.outputParamIds[dataType] =
                        modelData.app.outputParamIds.fastq_reads;
                    modelData.inputs[dataType] = {
                        appId: 'kb_uploadmethods/import_fastq_sra_as_reads_from_staging',
                        files: ['fastq_fwd_1', 'fastq_fwd_2'],
                    };
                    modelData.params[dataType] = { filePaths: [], params: {} };
                });
                this._model = Props.make({
                    data: modelData,
                    onUpdate: () => {
                        /* intentionally left blank */
                    },
                });
                this._typesToFiles = {
                    dataType1: {
                        appId,
                        files: ['file1', 'file2'],
                    },
                    dataType2: {
                        appId,
                        files: ['file3', 'file4'],
                    },
                };
            });

            it('should toggle the active file type', function () {
                const configure = ConfigureTab.make({
                    bus,
                    model: this._model,
                    specs,
                    typesToFiles: this._typesToFiles,
                });

                return configure
                    .start({
                        node: container,
                    })
                    .then(() => {
                        const ftPanel = container.querySelector('[data-element="filetype-panel"]');
                        // expect that both buttons are there, and the first is selected
                        const btn1 = ftPanel.querySelector('[data-element="dataType1"]');
                        expect(
                            btn1.classList.contains(
                                'kb-bulk-import-configure__filetype_panel__filetype_button--selected'
                            )
                        ).toBeTruthy();
                        const btn2 = ftPanel.querySelector('[data-element="dataType2"]');
                        expect(
                            btn2.classList.contains(
                                'kb-bulk-import-configure__filetype_panel__filetype_button--selected'
                            )
                        ).toBeFalsy();

                        return new Promise((resolve) => {
                            bus.on('toggled-active-filetype', (message) => {
                                expect(message.fileType).toBe('dataType2');
                                expect(
                                    btn2.classList.contains(
                                        'kb-bulk-import-configure__filetype_panel__filetype_button--selected'
                                    )
                                ).toBeTrue();
                                resolve();
                            });

                            btn2.click();
                        });
                    })
                    .then(() => {
                        expect(this._model.getItem('state.selectedFileType')).toBe('dataType2');
                        const btn1 = container.querySelector(
                            '[data-element="filetype-panel"] [data-element="dataType1"]'
                        );
                        expect(
                            btn1.classList.contains(
                                'kb-bulk-import-configure__filetype_panel__filetype_button--selected'
                            )
                        ).toBeFalsy();
                    })
                    .then(() => configure.stop());
            });

            it('should start with output name duplication errors', async function () {
                const dupName = 'duplicate';
                // set up so both data types have the same input params, especially a duplicate
                // output value
                const params = {
                    filePaths: [
                        {
                            fastq_fwd_staging_file_name: 'fastq_fwd_1',
                            fastq_rev_staging_file_name: 'fastq_fwd_2',
                            name: dupName,
                        },
                    ],
                    params: {},
                };

                this._model.setItem('params.dataType1', params);
                this._model.setItem('params.dataType2', params);
                const configure = ConfigureTab.make({
                    bus,
                    model: this._model,
                    specs,
                    typesToFiles: this._typesToFiles,
                });

                await configure.start({ node: container });
                // expect to see an error on the only output param field.
                // this cribs a little bit from the filePathWidget test for verification.

                const outputNode = container.querySelector('div[data-parameter="name"]');
                const rowCell = outputNode.querySelector('.kb-field-cell__rowCell');
                expect(rowCell.classList).toContain('kb-field-cell__error_message');
                const dupMessage = rowCell.querySelector(
                    '.kb-field-cell__message_panel__duplicate'
                );
                expect(dupMessage.classList).not.toContain('hidden');
                expect(dupMessage.innerHTML).toContain('duplicate value found');
                await configure.stop();
            });
        });
    });
});
