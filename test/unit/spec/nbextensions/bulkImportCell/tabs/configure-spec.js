define([
    '/narrative/nbextensions/bulkImportCell/tabs/configure',
    'base/js/namespace',
    'common/runtime',
    'common/props',
    'common/spec',
    'testUtil',
    '/test/data/testAppObj',
], (ConfigureTab, Jupyter, Runtime, Props, Spec, TestUtil, TestAppObject) => {
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
                appSpec: TestAppObject.app.specs[appId],
            }),
            specs = {};
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
                    data: Object.assign({}, TestAppObject, { state: initialState }),
                    onUpdate: () => {},
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
                data: Object.assign({}, TestAppObject, { state: initialState }),
                onUpdate: () => {},
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

        it('should toggle the active file type', () => {
            initialState = {
                state: 'editingIncomplete',
                params: {
                    dataType1: 'incomplete',
                    dataType2: 'incomplete',
                },
                selectedFileType: 'dataType1',
            };
            const modelData = Object.assign({}, TestAppObject, { state: initialState });
            ['dataType1', 'dataType2'].forEach((dataType) => {
                modelData.app.fileParamIds[dataType] = modelData.app.fileParamIds.fastq_reads;
                modelData.app.otherParamIds[dataType] = modelData.app.otherParamIds.fastq_reads;
                modelData.inputs[dataType] = [];
                modelData.params[dataType] = { filePaths: [], params: {} };
            });
            const _model = Props.make({
                data: modelData,
                onUpdate: () => {},
            });
            const _typesToFiles = {
                dataType1: {
                    appId,
                    files: ['file1', 'file2'],
                },
                dataType2: {
                    appId,
                    files: ['file3', 'file4'],
                },
            };
            const configure = ConfigureTab.make({
                bus,
                model: _model,
                specs,
                typesToFiles: _typesToFiles,
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
                    expect(_model.getItem('state.selectedFileType')).toBe('dataType2');
                    const btn1 = container.querySelector(
                        '[data-element="filetype-panel"] [data-element="dataType1"]'
                    );
                    expect(
                        btn1.classList.contains(
                            'kb-bulk-import-configure__filetype_panel__filetype_button--selected'
                        )
                    ).toBeFalsy();
                });
        });
    });
});
