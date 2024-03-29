define([
    '/narrative/nbextensions/bulkImportCell/tabs/configure',
    'base/js/namespace',
    'common/runtime',
    'common/props',
    'common/spec',
    'common/ui',
    'util/appCellUtil',
    'testUtil',
    'narrativeMocks',
    '/test/data/testBulkImportObj',
], (
    ConfigureTab,
    Jupyter,
    Runtime,
    Props,
    Spec,
    UI,
    AppCellUtil,
    TestUtil,
    Mocks,
    TestBulkImportObject
) => {
    'use strict';

    describe('test the bulk import cell configure tab', () => {
        const appId = 'kb_uploadmethods/import_fastq_sra_as_reads_from_staging',
            typesToFiles = {
                fastq_reads: {
                    appId,
                    files: ['file1', 'file2'],
                },
            },
            fileTypesDisplay = {
                fastq_reads: {
                    label: 'FASTQ Reads Interleaved',
                },
                dataType1: {
                    label: 'Data Type One',
                },
                dataType2: {
                    label: 'Data Type II',
                },
            },
            fileTypeMapping = {
                fastq_reads: 'FASTQ Reads Interleaved',
                dataType1: 'Data Type One',
                dataType2: 'Data Type II',
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
            bus = runtime.bus();
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

            Mocks.mockJsonRpc1Call({
                url: runtime.config('services.workspace.url'),
                body: /get_object_info_new/,
                response: [null],
            });

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
            describe(`${testCase.label} mode`, () => {
                let configureWidget;
                beforeEach(() => {
                    const model = Props.make({
                        data: Object.assign({}, TestBulkImportObject, { state: initialState }),
                        onUpdate: () => {
                            /* intentionally left blank */
                        },
                    });
                    configureWidget = testCase.widget.make({
                        bus,
                        model,
                        specs,
                        typesToFiles,
                        fileTypesDisplay,
                        fileTypeMapping,
                    });
                });

                it(`should start in ${testCase.label} mode`, async () => {
                    await configureWidget.start({ node: container });
                    // just make sure it renders the "File Paths" and "Parameters" headers
                    expect(container.innerHTML).toContain('Parameters');
                    expect(container.innerHTML).toContain('File Paths');
                    const inputForm = container.querySelector(
                        '[data-parameter="import_type"] select[data-element="input"]'
                    );
                    expect(inputForm.hasAttribute('readonly')).toBe(testCase.viewOnly);
                    spyOn(UI, 'showConfirmDialog').and.resolveTo(false);
                    const xsvButton = container.querySelector(
                        '.kb-bulk-import-configure__button--generate-template'
                    );
                    // click on the button to check it functions correctly
                    xsvButton.click();
                    expect(xsvButton.textContent).toContain('Create Import Template');
                    expect(UI.showConfirmDialog).toHaveBeenCalled();
                    await configureWidget.stop();
                });

                it(`should ${testCase.viewOnly ? 'not ' : ''}show file type icons`, async () => {
                    await configureWidget.start({ node: container });
                    const filePanelButtons = container.querySelectorAll(
                        '.kb-bulk-import-configure__panel--filetype button'
                    );
                    for (const fpButton of filePanelButtons) {
                        const icon = fpButton.querySelector('.kb-filetype-panel__filetype_icon');
                        const hasCheck = icon.classList.contains('fa-check');
                        const hasExclamation = icon.classList.contains('fa-exclamation');
                        // if withIcon, should have one of fa-exclamation, fa-check
                        // otherwise, should have neither
                        expect(hasCheck || hasExclamation).toBe(!testCase.viewOnly);
                    }
                });

                it(`should ${
                    testCase.viewOnly ? 'not ' : ''
                }validate parameters on startup`, async () => {
                    // set up spy. we hope.
                    spyOn(AppCellUtil, 'evaluateConfigReadyState').and.resolveTo({});
                    await configureWidget.start({ node: container });
                    if (testCase.viewOnly) {
                        expect(AppCellUtil.evaluateConfigReadyState).not.toHaveBeenCalled();
                    } else {
                        expect(AppCellUtil.evaluateConfigReadyState).toHaveBeenCalled();
                    }
                });
            });
        });

        it('starts with a disappearing loading spinner', () => {
            const model = Props.make({
                data: Object.assign({}, TestBulkImportObject, { state: initialState }),
                onUpdate: () => {
                    /* intentionally left blank */
                },
            });
            spyOn(UI, 'loading').and.callThrough();
            const configure = ConfigureTab.make({
                bus,
                model,
                specs,
                typesToFiles,
                fileTypesDisplay,
                fileTypeMapping,
            });

            return configure
                .start({
                    node: container,
                })
                .then(() => {
                    // it's hard to trap when this appears / disappears when run in tests.
                    // just make sure it's been called, and the .kb-loading-spinner node
                    // no longer exists.
                    expect(UI.loading).toHaveBeenCalled();
                    expect(container.querySelector('.kb-loading-spinner')).toBeNull();
                    return configure.stop();
                })
                .then(() => {
                    expect(container.innerHTML).toEqual('');
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
                fileTypesDisplay,
                fileTypeMapping,
            });

            return configure
                .start({
                    node: container,
                })
                .then(() => {
                    // just make sure it renders the "Parameters" header
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
                    fileTypesDisplay,
                    fileTypeMapping,
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
                    fileTypesDisplay,
                    fileTypeMapping,
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
                        messages: [
                            {
                                type: 'warning',
                                message: 'message for data type 1',
                            },
                        ],
                    },
                    dataType2: {
                        appId,
                        files: ['file3', 'file4'],
                        messages: [
                            {
                                type: 'error',
                                message: 'Error message for data type 2',
                            },
                        ],
                    },
                };
            });

            it('should toggle the active file type', async function () {
                const configure = ConfigureTab.make({
                    bus,
                    model: this._model,
                    specs,
                    typesToFiles: this._typesToFiles,
                    fileTypesDisplay,
                    fileTypeMapping,
                });

                await configure.start({ node: container });
                // TEST FOR DATA TYPE 1
                const ftPanel = container.querySelector('[data-element="filetype-panel"]');
                // expect that both buttons are there, and the first is selected
                const btn1 = ftPanel.querySelector('[data-element="dataType1"]');
                expect(btn1.classList).toContain('kb-filetype-panel__filetype_button--selected');
                const btn2 = ftPanel.querySelector('[data-element="dataType2"]');
                expect(btn2.classList).not.toContain(
                    'kb-filetype-panel__filetype_button--selected'
                );
                expect(container.innerHTML).toContain('Parameters');

                // message tests (detailed tests are in the message tests spec below)
                let msgContainer = container.querySelector('[data-element="config-message"]');
                expect(msgContainer).toBeDefined();
                expect(msgContainer.childElementCount).toBe(1);
                let msg = msgContainer.firstChild;
                expect(msg.classList).toContain('kb-bulk-import-configure__message--warning');
                expect(msg.textContent).toContain(this._typesToFiles.dataType1.messages[0].message);

                let toggledMsg;
                bus.on('toggled-active-filetype', (message) => {
                    toggledMsg = message;
                });

                btn2.click();
                await TestUtil.wait(500);
                expect(toggledMsg.fileType).toBe('dataType2');
                expect(btn2.classList).toContain('kb-filetype-panel__filetype_button--selected');

                // TEST FOR DATA TYPE 2
                expect(this._model.getItem('state.selectedFileType')).toBe('dataType2');
                expect(btn1.classList).not.toContain(
                    'kb-filetype-panel__filetype_button--selected'
                );
                // message tests!
                msgContainer = container.querySelector('[data-element="config-message"]');
                expect(msgContainer).toBeDefined();
                expect(msgContainer.childElementCount).toBe(1);
                msg = msgContainer.firstChild;
                expect(msg.classList).toContain('kb-bulk-import-configure__message--error');
                expect(msg.textContent).toContain(this._typesToFiles.dataType2.messages[0].message);
                await configure.stop();
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
                    fileTypesDisplay,
                    fileTypeMapping,
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

        describe('message tests', () => {
            const defWarning = {
                type: 'warning',
                message: 'a warning',
            };
            const defError = {
                type: 'error',
                message: 'an error',
            };
            const warningWithLink = {
                type: 'warning',
                message: 'a warning',
                link: 'https://docs.kbase.us',
            };
            [
                {
                    msgs: [defWarning],
                    label: 'a warning message',
                },
                {
                    msgs: [defWarning, defError, defWarning, defError],
                    label: 'multiple error and warning messages',
                },
                {
                    msgs: [defError],
                    label: 'an error message',
                },
                {
                    msgs: [
                        {
                            type: 'unknown',
                            message: 'some message',
                        },
                    ],
                    label: 'an unknown message, defaulting to warning',
                },
                {
                    msgs: [
                        {
                            message: 'some untitled message',
                        },
                    ],
                    label: 'a message with a missing type, defaulting to warning',
                },
                {
                    msgs: [warningWithLink],
                    label: 'a warning message with a URL',
                },
            ].forEach((testCase) => {
                it(`should show ${testCase.label}`, async () => {
                    const fileType = initialState.selectedFileType;
                    const messageTypesToFiles = TestUtil.JSONcopy(typesToFiles);
                    messageTypesToFiles[fileType].messages = testCase.msgs;
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
                        typesToFiles: messageTypesToFiles,
                        fileTypesDisplay,
                        fileTypeMapping,
                    });

                    await configure.start({ node: container });
                    // just make sure it renders the "File Paths" and "Parameters" headers
                    expect(container.innerHTML).toContain('Parameters');
                    const msgContainer = container.querySelector('[data-element="config-message"]');
                    expect(msgContainer).toBeDefined();
                    expect(msgContainer.childElementCount).toBe(testCase.msgs.length);
                    // each message should be as in the test case
                    msgContainer.childNodes.forEach((msgNode, index) => {
                        const testMsg = testCase.msgs[index];
                        // we should have the text in there.
                        expect(msgNode.textContent).toContain(testMsg.message);
                        // we should have the right classes
                        expect(msgNode.classList).toContain('kb-bulk-import-configure__message');
                        // the class should default to warning
                        let msgType = testMsg.type;
                        if (msgType !== 'error' && msgType !== 'warning') {
                            msgType = 'warning';
                        }
                        expect(msgNode.classList).toContain(
                            `kb-bulk-import-configure__message--${msgType}`
                        );
                        const titleElem = msgNode.querySelector(
                            `.kb-bulk-import-configure__message--${msgType}-title`
                        );
                        // if there's a link on the message, expect it to be rendered
                        const msgLinkNode = msgNode.querySelector('a');
                        if (testMsg.link) {
                            expect(msgLinkNode).not.toBeNull();
                            expect(msgLinkNode.getAttribute('href')).toEqual(testMsg.link);
                            expect(msgLinkNode.querySelector('i').classList).toContain(
                                'fa-external-link'
                            );
                        } else {
                            expect(msgLinkNode).toBeNull();
                        }
                        // the title should have an icon
                        expect(titleElem.querySelector('i.fa.fa-exclamation-circle')).toBeDefined();
                        expect(titleElem.textContent.toLowerCase()).toContain(msgType);
                    });
                    await configure.stop();
                    expect(container.innerHTML).toEqual('');
                });
            });

            it('should not show a message when text is missing', async () => {
                const badMsg = [
                    {
                        type: 'error',
                    },
                ];
                const messageTypesToFiles = TestUtil.JSONcopy(typesToFiles);
                messageTypesToFiles[initialState.selectedFileType].messages = badMsg;
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
                    typesToFiles: messageTypesToFiles,
                    fileTypesDisplay,
                    fileTypeMapping,
                });

                await configure.start({ node: container });
                const msgContainer = container.querySelector('[data-element="config-message"]');
                expect(msgContainer).toBeDefined();
                expect(msgContainer.childElementCount).toBe(0);
                await configure.stop();
                expect(container.innerHTML).toEqual('');
            });
        });
    });
});
