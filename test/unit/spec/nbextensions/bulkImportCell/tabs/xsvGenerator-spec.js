define([
    'jquery',
    '/narrative/nbextensions/bulkImportCell/tabs/xsvGenerator',
    'common/props',
    'common/ui',
], ($, XSVGenerator, Props, UI) => {
    'use strict';

    const miniSpec = {
        'kb_uploadmethods/import_fastq_interleaved_as_reads_from_staging': {
            parameters: [
                {
                    id: 'fastq_fwd_staging_file_name',
                    ui_name: 'Forward/left FASTQ file path',
                },
                {
                    id: 'name',
                    ui_name: 'Reads object name',
                },
            ],
        },
        'kb_uploadmethods/import_fastq_noninterleaved_as_reads_from_staging': {
            parameters: [
                {
                    id: 'fastq_fwd_staging_file_name',
                    ui_name: 'Forward/left FASTQ file path',
                },
                {
                    id: 'fastq_rev_staging_file_name',
                    ui_name: 'Reverse/right FASTQ file path',
                },
                {
                    id: 'name',
                    ui_name: 'Reads object name',
                },
                {
                    id: 'read_orientation_outward',
                    ui_name: 'Reads orientation outward',
                },
            ],
        },
        'kb_uploadmethods/import_sra_as_reads_from_staging': {
            parameters: [
                {
                    id: 'sra_staging_file_name',
                    ui_name: 'SRA file path',
                },
                {
                    id: 'sequencing_tech',
                    ui_name: 'Sequencing technology',
                },
                {
                    id: 'name',
                    ui_name: 'Reads object name',
                },
                {
                    id: 'read_orientation_outward',
                    ui_name: 'Reads orientation outward',
                },
            ],
        },
    };

    const params = {
        fastq_reads_interleaved: {
            filePaths: [
                {
                    fastq_fwd_staging_file_name: 'go.fastq',
                    name: 'go.fastq_reads',
                },
            ],
            params: {},
        },
        fastq_reads_noninterleaved: {
            filePaths: [
                {
                    fastq_fwd_staging_file_name: null,
                    fastq_rev_staging_file_name: null,
                    name: null,
                },
                {
                    fastq_fwd_staging_file_name: null,
                    fastq_rev_staging_file_name: null,
                    name: null,
                },
            ],
            params: {
                read_orientation_outward: 0,
            },
        },
        sra_reads: {
            filePaths: [
                {
                    name: 'sample_sra_reads',
                    sra_staging_file_name: 'sample_sra',
                },
            ],
            params: {
                read_orientation_outward: 0,
                sequencing_tech: 'Illumina',
            },
        },
    };

    const expectedOutput = {
        fastq_reads_interleaved: {
            order_and_display: [
                ['fastq_fwd_staging_file_name', 'Forward/left FASTQ file path'],
                ['name', 'Reads object name'],
            ],
            data: [
                {
                    fastq_fwd_staging_file_name: 'go.fastq',
                    name: 'go.fastq_reads',
                },
            ],
        },
        fastq_reads_noninterleaved: {
            order_and_display: [
                ['fastq_fwd_staging_file_name', 'Forward/left FASTQ file path'],
                ['fastq_rev_staging_file_name', 'Reverse/right FASTQ file path'],
                ['name', 'Reads object name'],
                ['read_orientation_outward', 'Reads orientation outward'],
            ],
            data: [
                {
                    fastq_fwd_staging_file_name: null,
                    fastq_rev_staging_file_name: null,
                    name: null,
                    read_orientation_outward: 0,
                },
                {
                    fastq_fwd_staging_file_name: null,
                    fastq_rev_staging_file_name: null,
                    name: null,
                    read_orientation_outward: 0,
                },
            ],
        },
        sra_reads: {
            order_and_display: [
                ['sra_staging_file_name', 'SRA file path'],
                ['sequencing_tech', 'Sequencing technology'],
                ['name', 'Reads object name'],
                ['read_orientation_outward', 'Reads orientation outward'],
            ],
            data: [
                {
                    name: 'sample_sra_reads',
                    sra_staging_file_name: 'sample_sra',
                    read_orientation_outward: 0,
                    sequencing_tech: 'Illumina',
                },
            ],
        },
    };

    const state = {
        params: {
            fastq_reads_interleaved: 'complete',
            fastq_reads_noninterleaved: 'error',
            sra_reads: 'complete',
        },
        selectedAppId: 'kb_uploadmethods/import_sra_as_reads_from_staging',
        selectedFileType: 'fastq_reads_noninterleaved',
    };

    const defaultModel = Props.make({
        data: {
            state,
            params,
            app: {
                specs: miniSpec,
            },
        },
    });

    const typesToFiles = {
        fastq_reads_interleaved: {
            appId: 'kb_uploadmethods/import_fastq_interleaved_as_reads_from_staging',
        },
        fastq_reads_noninterleaved: {
            appId: 'kb_uploadmethods/import_fastq_noninterleaved_as_reads_from_staging',
        },
        sra_reads: {
            appId: 'kb_uploadmethods/import_sra_as_reads_from_staging',
        },
    };
    describe('the xsv generator', () => {
        describe('module', () => {
            it('can be instantiated', () => {
                const xsvGen = new XSVGenerator({ model: {}, typesToFiles });
                expect(xsvGen).toBeDefined();
                expect(xsvGen.run).toEqual(jasmine.any(Function));
                expect(xsvGen.cssBaseClass).toEqual(jasmine.any(String));
            });
        });

        const cssBaseClass = new XSVGenerator({ model: {}, typesToFiles }).cssBaseClass;
        describe('instance', () => {
            it('requires a model to work', () => {
                expect(() => {
                    new XSVGenerator();
                }).toThrowError(/XSV Generator requires the param "model" for instantiation/);
            });
            it('requires the typesToFiles mapping to work', () => {
                expect(() => {
                    new XSVGenerator({ model: {} });
                }).toThrowError(
                    /XSV Generator requires the param "typesToFiles" for instantiation/
                );
            });

            describe('run', () => {
                async function checkStartUpDialog(modelData, hasError) {
                    const model = Props.make({
                        data: modelData,
                    });
                    const xsvGen = new XSVGenerator({ model, typesToFiles });
                    spyOn(UI, 'showConfirmDialog').and.resolveTo(false);
                    await xsvGen.run();
                    expect(UI.showConfirmDialog).toHaveBeenCalledTimes(1);
                    const calls = UI.showConfirmDialog.calls.allArgs()[0];
                    expect(calls.length).toEqual(1);
                    expect(calls[0].title).toEqual('Create CSV Template');
                    const errorString = 'Please note that there are errors in the input parameters';
                    if (hasError) {
                        expect(calls[0].body).toContain(errorString);
                    } else {
                        expect(calls[0].body).not.toContain(errorString);
                    }
                }
                it('does not show a warning with no errors', async () => {
                    await checkStartUpDialog(
                        {
                            state: {
                                params: {
                                    this: 'complete',
                                    is: 'complete',
                                    fine: 'complete',
                                },
                                selectedFileType: 'fine',
                            },
                        },
                        false
                    );
                });

                it('shows a warning if there are app input validation errors', async () => {
                    await checkStartUpDialog(
                        {
                            state: {
                                params: {
                                    this: 'complete',
                                    is: 'incomplete',
                                    wrong: 'incomplete',
                                },
                                selectedFileType: 'wrong',
                            },
                        },
                        true
                    );
                });
            });

            describe('generateRequest', () => {
                beforeEach(function () {
                    this.xsvGen = new XSVGenerator({ model: defaultModel, typesToFiles });
                });
                const output_file_type = 'CSV',
                    output_directory = 'new_folder';

                it('generates params with a single input', function () {
                    const output = this.xsvGen.generateRequest({
                        output_file_type,
                        output_directory,
                        types: ['sra_reads'],
                    });
                    expect(output).toEqual({
                        output_file_type,
                        output_directory,
                        types: {
                            sra_reads: expectedOutput.sra_reads,
                        },
                    });
                });

                it('generates params with several inputs', function () {
                    const output = this.xsvGen.generateRequest({
                        output_directory,
                        output_file_type,
                        types: Object.keys(params),
                    });
                    expect(output).toEqual({
                        types: expectedOutput,
                        output_directory,
                        output_file_type,
                    });
                });
            });

            describe('sendRequest', () => {
                beforeEach(function () {
                    this.xsvGen = new XSVGenerator({ model: {}, typesToFiles });
                    this.xsvGen.runtime = {
                        config: () => {
                            return 'http://example.com';
                        },
                        authToken: () => {
                            return 'TOKEN';
                        },
                    };
                    spyOn(UI, 'showInfoDialog').and.callFake((args) => {
                        this.title = args.title;
                        this.container = document.createElement('div');
                        this.container.innerHTML = args.body;
                    });
                });

                it('creates a staging service client and executes the request', function () {
                    spyOn($, 'ajax');
                    this.xsvGen.sendRequest(expectedOutput);
                    expect(this.xsvGen.stagingServiceClient).toEqual(jasmine.any(Object));
                    expect(this.xsvGen.stagingServiceClient.write_bulk_specification).toEqual(
                        jasmine.any(Function)
                    );
                    // expect one call to have been made with a single argument
                    expect($.ajax).toHaveBeenCalledTimes(1);
                    expect($.ajax.calls.allArgs()[0].length).toEqual(1);
                    const ajaxCalls = $.ajax.calls.allArgs()[0][0];
                    expect(ajaxCalls).toEqual(
                        jasmine.objectContaining({
                            dataType: 'json',
                            data: JSON.stringify(expectedOutput),
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: 'TOKEN',
                            },
                        })
                    );
                    expect(ajaxCalls.url).toMatch(/http:\/\/example.com/);
                });

                it('reuses an existing staging service client', function () {
                    return new Promise((resolve) => {
                        // set up a fake staging service client on the xsvGen object
                        this.xsvGen.stagingServiceClient = {
                            write_bulk_specification: (args) => {
                                expect(args).toEqual({
                                    data: expectedOutput,
                                    dataType: 'json',
                                    headers: { 'Content-Type': 'application/json' },
                                });
                                resolve();
                            },
                        };
                        // expectedOutput is a valid set of request params
                        this.xsvGen.sendRequest(expectedOutput);
                    });
                });
            });

            describe('responses', () => {
                beforeEach(function () {
                    this.xsvGen = new XSVGenerator({ model: {}, typesToFiles });
                    spyOn(UI, 'showInfoDialog').and.callFake((args) => {
                        this.title = args.title;
                        this.container = document.createElement('div');
                        this.container.innerHTML = args.body;
                    });
                });
                it('displays a success message, single file', function () {
                    const result = {
                        output_file_type: 'CSV',
                        files_created: {
                            assembly: 'your_name_here/new folder/assembly.csv',
                        },
                    };
                    this.xsvGen.displayResult(result);
                    expect(this.title).toEqual('Template Generation Successful!');
                    expect(
                        this.container.querySelector(`.${cssBaseClass}__result_text`).textContent
                    ).toEqual('The following file has been added to the staging area:');
                    expect(
                        this.container.querySelectorAll(`.${cssBaseClass}__file_list_item`).length
                    ).toEqual(Object.keys(result.files_created).length);
                    expect(
                        this.container.querySelector(`.${cssBaseClass}__file_list_item`).textContent
                    ).toEqual('your_name_here/new folder/assembly.csv');
                });

                it('displays a success message, multiple files', function () {
                    const result = {
                        output_file_type: 'CSV',
                        files_created: {
                            assembly: 'your_name_here/new folder/assembly.csv',
                            fastq_reads_interleaved:
                                'your_name_here/new folder/fastq_reads_interleaved.csv',
                            fastq_reads_noninterleaved:
                                'your_name_here/new folder/fastq_reads_noninterleaved.csv',
                            genbank_genome: 'your_name_here/new folder/genbank_genome.csv',
                            sra_reads: 'your_name_here/new folder/sra_reads.csv',
                        },
                    };
                    this.xsvGen.displayResult(result);
                    expect(this.title).toEqual('Template Generation Successful!');
                    expect(
                        this.container.querySelector(`.${cssBaseClass}__result_text`).textContent
                    ).toEqual('The following files have been added to the staging area:');
                    const fileList = Array.from(
                        this.container.querySelectorAll(`.${cssBaseClass}__file_list_item`)
                    );
                    expect(fileList.length).toEqual(Object.keys(result.files_created).length);
                    expect(
                        fileList.map((liElement) => {
                            return liElement.textContent;
                        })
                    ).toEqual(jasmine.arrayWithExactContents(Object.values(result.files_created)));
                });

                it('displays an error message, query successful but no files created', function () {
                    const result = {
                        output_file_type: 'CSV',
                        files_created: {},
                    };
                    this.xsvGen.displayResult(result);
                    expect(this.container.textContent).toContain(
                        'Template generation failed with the following error:'
                    );
                    expect(this.container.textContent).toContain('No files were created.');
                });

                it('displays an error message when things go wrong', function () {
                    this.xsvGen.displayResult({ error: 'Invalid output_file_type: DNA' });
                    expect(this.title).toEqual('Template Generation Error');
                    expect(this.container.textContent).toContain(
                        'Template generation failed with the following error:'
                    );
                    expect(this.container.textContent).toContain('Invalid output_file_type: DNA');
                });
            });
        });
    });
});
