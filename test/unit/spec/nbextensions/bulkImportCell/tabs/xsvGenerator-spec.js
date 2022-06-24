define([
    'jquery',
    '/narrative/nbextensions/bulkImportCell/tabs/xsvGenerator',
    'common/props',
    'common/ui',
    'testUtil',
    'json!/test/data/kb_uploadmethods.import_fastq_interleaved_as_reads_from_staging.spec.json',
    'json!/test/data/kb_uploadmethods.import_fastq_noninterleaved_as_reads_from_staging.spec.json',
    'json!/test/data/kb_uploadmethods.import_genbank_as_genome_from_staging.spec.json',
    'json!/test/data/kb_uploadmethods.import_sra_as_reads_from_staging.spec.json',
], (
    $,
    XSVGenerator,
    Props,
    UI,
    TestUtil,
    ImportFastqInterleavedSpec,
    ImportFastqNonInterleavedSpec,
    ImportGenbankGenomeSpec,
    ImportSraReadsSpec
) => {
    'use strict';

    const typesToFiles = {
        fastq_reads_interleaved: {
            appId: 'kb_uploadmethods/import_fastq_interleaved_as_reads_from_staging',
        },
        fastq_reads_noninterleaved: {
            appId: 'kb_uploadmethods/import_fastq_noninterleaved_as_reads_from_staging',
        },
        genbank_genome: {
            appId: 'kb_uploadmethods/import_genbank_as_genome_from_staging',
        },
        sra_reads: {
            appId: 'kb_uploadmethods/import_sra_as_reads_from_staging',
        },
    };
    const fileTypeMapping = {
        fastq_reads_interleaved: 'FASTQ something',
        fastq_reads_noninterleaved: 'FASTQ something else',
        genbank_genome: 'Genbank',
        sra_reads: 'SRA reads',
    };

    const miniSpec = {
        'kb_uploadmethods/import_fastq_interleaved_as_reads_from_staging':
            ImportFastqInterleavedSpec,
        'kb_uploadmethods/import_fastq_noninterleaved_as_reads_from_staging':
            ImportFastqNonInterleavedSpec,
        'kb_uploadmethods/import_genbank_as_genome_from_staging': ImportGenbankGenomeSpec,
        'kb_uploadmethods/import_sra_as_reads_from_staging': ImportSraReadsSpec,
    };

    const paramDisplay = {
        genbank_genome: {
            params: {
                scientific_name: {
                    ncbi_taxon_id: 1336561,
                    scientific_name: 'Paraba multicolor',
                },
            },
        },
    };

    const params = {
        fastq_reads_interleaved: {
            filePaths: [
                {
                    fastq_fwd_staging_file_name: 'only_forward.fastq',
                    name: 'only_forward.fastq_reads',
                },
            ],
            params: {
                insert_size_mean: null,
                insert_size_std_dev: null,
                read_orientation_outward: 0,
                sequencing_tech: 'Illumina',
                single_genome: 1,
            },
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
                insert_size_mean: null,
                insert_size_std_dev: null,
                read_orientation_outward: 0,
                sequencing_tech: 'Illumina',
                single_genome: 1,
            },
        },
        genbank_genome: {
            filePaths: [
                {
                    staging_file_subdir_path: 'random_file.gbk',
                    genome_name: 'random_file.gbk_genome',
                },
                {
                    staging_file_subdir_path: 'less_random_file.genbank',
                    genome_name: 'less_random_file.genbank_genome',
                },
            ],
            params: {
                genome_type: 'mag',
                source: 'RefSeq user',
                release: '6.66',
                genetic_code: 1234,
                scientific_name: '1336561',
                generate_ids_if_needed: 1,
                generate_missing_genes: 1,
            },
        },
        sra_reads: {
            filePaths: [
                {
                    name: 'some_sra_file_reads',
                    sra_staging_file_name: 'some_sra_file',
                },
            ],
            params: {
                insert_size_mean: null,
                insert_size_std_dev: null,
                read_orientation_outward: 0,
                sequencing_tech: 'Illumina',
                single_genome: 1,
            },
        },
    };

    const expectedOutput = {
        fastq_reads_noninterleaved: {
            order_and_display: [
                ['fastq_fwd_staging_file_name', 'Forward/left FASTQ file path'],
                ['fastq_rev_staging_file_name', 'Reverse/right FASTQ file path'],
                ['sequencing_tech', 'Sequencing technology'],
                ['name', 'Reads object name'],
                ['single_genome', 'Single genome'],
                ['read_orientation_outward', 'Reads orientation outward'],
                ['insert_size_std_dev', 'St. dev. of insert size'],
                ['insert_size_mean', 'Mean insert size'],
            ],
            data: [
                {
                    fastq_fwd_staging_file_name: null,
                    fastq_rev_staging_file_name: null,
                    name: null,
                    insert_size_mean: null,
                    insert_size_std_dev: null,
                    read_orientation_outward: 0,
                    sequencing_tech: 'Illumina',
                    single_genome: 1,
                },
                {
                    fastq_fwd_staging_file_name: null,
                    fastq_rev_staging_file_name: null,
                    name: null,
                    insert_size_mean: null,
                    insert_size_std_dev: null,
                    read_orientation_outward: 0,
                    sequencing_tech: 'Illumina',
                    single_genome: 1,
                },
            ],
        },
        fastq_reads_interleaved: {
            order_and_display: [
                ['fastq_fwd_staging_file_name', 'Forward/left FASTQ file path'],
                ['sequencing_tech', 'Sequencing technology'],
                ['name', 'Reads object name'],
                ['single_genome', 'Single genome'],
                ['read_orientation_outward', 'Reads orientation outward'],
                ['insert_size_std_dev', 'St. dev. of insert size'],
                ['insert_size_mean', 'Mean insert size'],
            ],
            data: [
                {
                    fastq_fwd_staging_file_name: 'only_forward.fastq',
                    name: 'only_forward.fastq_reads',
                    insert_size_mean: null,
                    insert_size_std_dev: null,
                    read_orientation_outward: 0,
                    sequencing_tech: 'Illumina',
                    single_genome: 1,
                },
            ],
        },
        genbank_genome: {
            order_and_display: [
                ['staging_file_subdir_path', 'GenBank File Path'],
                ['genome_name', 'Genome Object Name'],
                ['genome_type', 'Genome Type'],
                ['source', 'Source of the GenBank File'],
                ['release', 'Release or Version of the Source Data'],
                ['genetic_code', 'Genetic Code for the Organism'],
                ['scientific_name', 'Scientific Name'],
                ['generate_ids_if_needed', 'Generate Feature IDs if Needed'],
                ['generate_missing_genes', 'Spoof Genes for parentless CDS'],
            ],
            data: [
                {
                    staging_file_subdir_path: 'random_file.gbk',
                    genome_name: 'random_file.gbk_genome',
                    genome_type: 'Metagenome-assembled genome (MAG)',
                    source: 'RefSeq',
                    release: '6.66',
                    genetic_code: 1234,
                    scientific_name: 'Paraba multicolor',
                    generate_ids_if_needed: 1,
                    generate_missing_genes: 1,
                },
                {
                    staging_file_subdir_path: 'less_random_file.genbank',
                    genome_name: 'less_random_file.genbank_genome',
                    genome_type: 'Metagenome-assembled genome (MAG)',
                    source: 'RefSeq',
                    release: '6.66',
                    genetic_code: 1234,
                    scientific_name: 'Paraba multicolor',
                    generate_ids_if_needed: 1,
                    generate_missing_genes: 1,
                },
            ],
        },
        sra_reads: {
            order_and_display: [
                ['sra_staging_file_name', 'SRA file path'],
                ['sequencing_tech', 'Sequencing technology'],
                ['name', 'Reads object name'],
                ['single_genome', 'Single genome'],
                ['read_orientation_outward', 'Reads orientation outward'],
                ['insert_size_std_dev', 'St. dev. of insert size'],
                ['insert_size_mean', 'Mean insert size'],
            ],
            data: [
                {
                    name: 'some_sra_file_reads',
                    sra_staging_file_name: 'some_sra_file',
                    insert_size_mean: null,
                    insert_size_std_dev: null,
                    read_orientation_outward: 0,
                    sequencing_tech: 'Illumina',
                    single_genome: 1,
                },
            ],
        },
    };

    const state = {
        params: {
            fastq_reads_interleaved: 'complete',
            fastq_reads_noninterleaved: 'error',
            genbank_genome: 'complete',
            sra_reads: 'complete',
        },
        selectedAppId: 'kb_uploadmethods/import_sra_as_reads_from_staging',
        selectedFileType: 'sra_reads',
    };

    const defaultModel = Props.make({
        data: {
            state,
            params,
            paramDisplay,
            app: {
                specs: miniSpec,
            },
        },
    });

    function createXsvGen() {
        return new XSVGenerator({ model: defaultModel, typesToFiles, fileTypeMapping });
    }

    describe('the XSV Generator', () => {
        describe('module', () => {
            it('can be instantiated', () => {
                const xsvGen = createXsvGen();
                expect(xsvGen).toBeDefined();
                expect(xsvGen.run).toEqual(jasmine.any(Function));
                expect(xsvGen.cssBaseClass).toEqual(jasmine.any(String));
            });
        });

        const cssBaseClass = new XSVGenerator({
            model: defaultModel,
            typesToFiles,
            fileTypeMapping,
        }).cssBaseClass;
        describe('instance', () => {
            it('requires a model', () => {
                expect(() => {
                    new XSVGenerator();
                }).toThrowError(/XSV Generator requires the param "model" for instantiation/);
            });
            it('requires the typesToFiles mapping', () => {
                expect(() => {
                    new XSVGenerator({ model: {} });
                }).toThrowError(
                    /XSV Generator requires the param "typesToFiles" for instantiation/
                );
            });

            it('requires the fileTypeMapping param', () => {
                expect(() => {
                    new XSVGenerator({ model: {}, typesToFiles: {} });
                }).toThrowError(
                    /XSV Generator requires the param "fileTypeMapping" for instantiation/
                );
            });

            xdescribe('createForm', () => {
                // TODO!
            });

            describe('renderLayout', () => {
                function checkStartUpDialog(modelData, hasError, isMulti = false) {
                    const model = Props.make({
                        data: {
                            state,
                            params,
                            app: {
                                specs: miniSpec,
                            },
                            ...modelData,
                        },
                    });
                    const xsvGen = new XSVGenerator({ model, typesToFiles, fileTypeMapping });
                    const container = document.createElement('div');
                    container.innerHTML = xsvGen.renderLayout();
                    const errorString = 'Please note that there are errors in the input parameters';
                    if (hasError) {
                        expect(container.textContent).toMatch(errorString);
                    } else {
                        expect(container.textContent).not.toMatch(errorString);
                    }
                    const multiFileInfo =
                        'Choosing Excel as output file type will create a single file with a page for each';
                    const guidanceSection = container.querySelector(
                        `.${cssBaseClass}__paragraph--guide`
                    );
                    if (isMulti) {
                        expect(guidanceSection.textContent).toContain(multiFileInfo);
                    } else {
                        expect(guidanceSection.textContent).not.toContain(multiFileInfo);
                    }
                }

                it('no errors, single param', () => {
                    checkStartUpDialog(
                        {
                            state: {
                                params: {
                                    fine: 'complete',
                                },
                                selectedFileType: 'fine',
                            },
                        },
                        false
                    );
                });

                it('has errors, single param', () => {
                    checkStartUpDialog(
                        {
                            state: {
                                params: {
                                    wrong: 'incomplete',
                                },
                                selectedFileType: 'wrong',
                            },
                        },
                        true
                    );
                });
                it('no errors, multi params', () => {
                    checkStartUpDialog(
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
                        false,
                        true
                    );
                });

                it('has errors, multi params', () => {
                    checkStartUpDialog(
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
                        true,
                        true
                    );
                });
            });

            describe('generateRequest', () => {
                beforeEach(function () {
                    this.xsvGen = createXsvGen();
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

            describe('run', () => {
                beforeEach(function () {
                    this.xsvGen = createXsvGen();
                });

                async function summonAndDismissModal(xsvGen, element) {
                    // wait for modal to appear
                    await TestUtil.waitForElement(document, element, () => {
                        xsvGen.run();
                    });

                    // click button and wait for modal to disappear
                    await TestUtil.waitForElementState(
                        document,
                        () => {
                            return document.querySelector(element) === null;
                        },
                        () => {
                            document.querySelector(element).click();
                        }
                    );
                }

                it('does not submit a request if the user does not click OK', async function () {
                    spyOn(this.xsvGen, 'runRequest');
                    spyOn(this.xsvGen, 'generateRequest').and.callThrough();
                    const element = '[data-element="cancel"]';
                    await summonAndDismissModal(this.xsvGen, element);
                    expect(this.xsvGen.runRequest.calls.allArgs()).toEqual([]);
                });

                it('submits a request if the user OKs it', async function () {
                    spyOn(this.xsvGen, 'runRequest');
                    spyOn(this.xsvGen, 'generateRequest').and.callThrough();
                    const element = '[data-element="ok"]';
                    await summonAndDismissModal(this.xsvGen, element);
                    // this should have generated the request params
                    expect(this.xsvGen.runRequest.calls.allArgs()).toEqual([
                        [
                            {
                                types: expectedOutput,
                                // these are the defaults
                                output_directory: 'bulk_import_templates',
                                output_file_type: 'CSV',
                            },
                        ],
                    ]);
                    expect(this.xsvGen.generateRequest).toHaveBeenCalled();
                });
            });

            describe('runRequest', () => {
                beforeEach(function () {
                    this.xsvGen = createXsvGen();
                });
                it('throws an error if there are no request params', function () {
                    expect(() => {
                        this.xsvGen.runRequest();
                    }).toThrowError('No request parameters specified!');
                });
            });

            describe('sendRequest', () => {
                beforeEach(function () {
                    this.xsvGen = new XSVGenerator({ model: {}, typesToFiles, fileTypeMapping });
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
                    this.xsvGen = new XSVGenerator({ model: {}, typesToFiles, fileTypeMapping });
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

                it('displays a success message, multiple types, single output file', function () {
                    const result = {
                        output_file_type: 'EXCEL',
                        files_created: {
                            assembly: 'your_name_here/new folder/import_specification.xlsx',
                            fastq_reads_interleaved:
                                'your_name_here/new folder/import_specification.xlsx',
                            fastq_reads_noninterleaved:
                                'your_name_here/new folder/import_specification.xlsx',
                            genbank_genome: 'your_name_here/new folder/import_specification.xlsx',
                            sra_reads: 'your_name_here/new folder/import_specification.xlsx',
                        },
                    };
                    this.xsvGen.displayResult(result);
                    expect(this.title).toEqual('Template Generation Successful!');
                    expect(
                        this.container.querySelector(`.${cssBaseClass}__result_text`).textContent
                    ).toEqual('The following file has been added to the staging area:');
                    const fileList = Array.from(
                        this.container.querySelectorAll(`.${cssBaseClass}__file_list_item`)
                    );
                    expect(fileList.length).toEqual(1);
                    expect(
                        fileList.map((liElement) => {
                            return liElement.textContent;
                        })
                    ).toEqual(['your_name_here/new folder/import_specification.xlsx']);
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
