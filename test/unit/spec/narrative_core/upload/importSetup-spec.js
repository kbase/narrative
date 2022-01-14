define([
    'kbase/js/widgets/narrative_core/upload/importSetup',
    'base/js/namespace',
    'narrativeConfig',
    'narrativeMocks',
    'testUtil',
    'json!/test/data/kb_uploadmethods.import_fastq_interleaved_as_reads_from_staging.spec.json',
    'json!/test/data/kb_uploadmethods.import_fastq_interleaved_as_reads_from_staging.info.json',
    'json!/test/data/kb_uploadmethods.import_fasta_as_assembly_from_staging.spec.json',
], (
    ImportSetup,
    Jupyter,
    Config,
    Mocks,
    TestUtil,
    ImportFastqSpec,
    ImportFastqInfo,
    ImportAssemblySpec
) => {
    'use strict';

    const uploaders = Config.get('uploaders');
    const stagingServiceUrl = Config.url('staging_api_url');
    const RELEASE_TAG = 'release';

    describe('ImportSetup module tests', () => {
        beforeAll(() => {
            Jupyter.narrative = {
                sidePanel: {
                    $methodsWidget: {
                        currentTag: RELEASE_TAG,
                    },
                },
                addAndPopulateApp: () => {},
                insertBulkImportCell: () => {},
                getAuthToken: () => 'fakeToken',
            };
        });

        beforeEach(() => {
            spyOn(Jupyter.narrative, 'addAndPopulateApp');
            spyOn(Jupyter.narrative, 'insertBulkImportCell');
            jasmine.Ajax.install();
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        afterAll(() => {
            Jupyter.narrative = null;
            TestUtil.clearRuntime();
        });

        it('should have expected functions', () => {
            ['setupImportCells', 'setupWebUploadCell'].forEach((fn) => {
                expect(ImportSetup[fn]).toEqual(jasmine.any(Function));
            });
        });

        describe('setupImportCells tests', () => {
            const TYPE = {
                FASTQ: 'fastq_reads_interleaved', // bulk
                SRA: 'sra_reads', // bulk
                MATRIX: 'expression_matrix', // not bulk
                MEDIA: 'media', // not bulk
            };

            const appIds = Object.values(TYPE).reduce((acc, appType) => {
                acc[appType] = uploaders.app_info[appType].app_id;
                return acc;
            }, {});

            const BULK = new Set([TYPE.FASTQ, TYPE.SRA]);
            const fileCounts = [1, 2, 5];

            /**
             * Builds the fileInfo array with the given number of files of each data type.
             * Returns an object with:
             * {
             *   fileInfo: array of file information (inputs to setupImportCells)
             *   biCell: boolean - if true, then a single BI cell should get made
             * }
             */
            function setupImportCellsInputs(numFiles, dataTypes) {
                let biCell = false;
                const fileInfo = [],
                    bulkFiles = new Set(),
                    nonBulkFiles = new Set();
                for (let i = 0; i < dataTypes.length; i++) {
                    for (let j = 0; j < numFiles; j++) {
                        const fileName = `file${i * numFiles + j + 1}`;
                        fileInfo.push({
                            name: fileName,
                            type: dataTypes[i],
                        });
                        if (BULK.has(dataTypes[i])) {
                            biCell = true;
                            bulkFiles.add(fileName);
                        } else {
                            nonBulkFiles.add(fileName);
                        }
                    }
                }
                return {
                    fileInfo,
                    biCell,
                    bulkFiles,
                    nonBulkFiles,
                };
            }

            // multiple file types, multiple of each
            // not gonna make a permuter because that's just overkill.
            const typeCombos = [
                ['FASTQ', 'SRA'],
                ['FASTQ', 'MATRIX'],
                ['FASTQ', 'SRA', 'MATRIX'],
                ['FASTQ', 'MATRIX', 'MEDIA'],
                ['FASTQ', 'SRA', 'MATRIX', 'MEDIA'],
            ].concat(Object.keys(TYPE).map((singleType) => [singleType]));
            fileCounts.forEach((numFiles) => {
                typeCombos.forEach((typeCombo) => {
                    const types = typeCombo.map((type) => TYPE[type]);
                    const nonBulkAppIds = new Set();
                    types.forEach((type) => {
                        if (!BULK.has(type)) {
                            nonBulkAppIds.add(appIds[type]);
                        }
                    });
                    const { fileInfo, biCell, bulkFiles, nonBulkFiles } = setupImportCellsInputs(
                        numFiles,
                        types
                    );
                    const totalFiles = fileInfo.length;

                    const numExpectedCells = (biCell ? 1 : 0) + nonBulkFiles.size;
                    const label = [
                        `should make ${numExpectedCells} cell${numExpectedCells > 1 ? 's' : ''} `,
                        biCell ? '(with a BI cell) ' : '',
                        `from ${totalFiles} file${totalFiles > 1 ? 's' : ''} `,
                        `distributed over ${types.length} type${types.length > 1 ? 's' : ''}: `,
                        types.join(', '),
                    ].join('');
                    it(label, async () => {
                        await ImportSetup.setupImportCells(fileInfo);
                        expect(Jupyter.narrative.insertBulkImportCell).toHaveBeenCalledTimes(
                            biCell ? 1 : 0
                        );
                        if (biCell) {
                            const callArgs =
                                Jupyter.narrative.insertBulkImportCell.calls.mostRecent().args[0];
                            // just spot check here that the right types are invoked and the structure's right.
                            types.forEach((type) => {
                                if (BULK.has(type)) {
                                    const typeInfo = callArgs[type];
                                    expect(typeInfo).toEqual(jasmine.any(Object));
                                    expect(typeInfo.appId).toEqual(appIds[type]);
                                    expect(typeInfo.files).toEqual(jasmine.any(Array));
                                    expect(typeInfo.files.length).toBeGreaterThan(0);
                                    typeInfo.files.forEach((file) => {
                                        expect(bulkFiles.has(file)).toBeTrue();
                                    });
                                }
                            });
                        }
                        expect(Jupyter.narrative.addAndPopulateApp).toHaveBeenCalledTimes(
                            nonBulkFiles.size
                        );
                        Jupyter.narrative.addAndPopulateApp.calls.all().forEach((usage) => {
                            const callArgs = usage.args;
                            // check for 3 things - the app id isn't one that's flagged bulk, it has a release tag,
                            // and it has an object with at least one key who's value is a file that's been
                            // pre-flagged as a nonBulk app
                            expect(callArgs.length).toEqual(3);
                            expect(nonBulkAppIds.has(callArgs[0])).toBeTrue();
                            expect(callArgs[1]).toEqual(RELEASE_TAG);
                            expect(callArgs[2]).toEqual(jasmine.any(Object));
                            expect(
                                Object.values(callArgs[2]).some((name) => nonBulkFiles.has(name))
                            ).toBeTrue();
                        });
                    });
                });
            });

            it('should silently not set up any cells with no files', async () => {
                await ImportSetup.setupImportCells([]);
                expect(Jupyter.narrative.addAndPopulateApp).not.toHaveBeenCalled();
                expect(Jupyter.narrative.insertBulkImportCell).not.toHaveBeenCalled();
            });

            it('should load a happy path bulk specification file into a bulk import cell', async () => {
                const readsDataType = 'fastq_reads_interleaved',
                    assemblyDataType = 'assembly',
                    importReadsData = [
                        {
                            fastq_fwd_staging_file_name: 'some_reads.fasta',
                            name: 'some_reads',
                            sequencing_tech: 'PacBio CLR',
                            single_genome: '1',
                            read_orientation_outward: '0',
                            insert_size_std_dev: 6.66,
                            insert_size_mean: 66.66,
                        },
                    ],
                    processedReadsData = [
                        {
                            fastq_fwd_staging_file_name: 'some_reads.fasta',
                            name: 'some_reads',
                            sequencing_tech: 'PacBio CLR',
                            single_genome: 1,
                            read_orientation_outward: 0,
                            insert_size_std_dev: 6.66,
                            insert_size_mean: 66.66,
                        },
                    ],
                    importAssemblyData = [
                        {
                            staging_file_subdir_path: 'some_assembly.fasta',
                            assembly_name: 'some_assembly',
                            type: 'Single amplified genome (SAG)',
                            min_contig_length: 1000,
                        },
                    ],
                    processedAssemblyData = [
                        {
                            staging_file_subdir_path: 'some_assembly.fasta',
                            assembly_name: 'some_assembly',
                            type: 'sag',
                            min_contig_length: 1000,
                        },
                    ],
                    readsCsv = 'some_reads_file.csv',
                    assemblyCsv = 'some_assembly_file.csv';

                jasmine.Ajax.stubRequest(
                    new RegExp(`${stagingServiceUrl}/bulk_specification`)
                ).andReturn({
                    status: 200,
                    statusText: 'success',
                    contentType: 'text/plain',
                    responseHeaders: '',
                    responseText: JSON.stringify({
                        types: {
                            [readsDataType]: importReadsData,
                            [assemblyDataType]: importAssemblyData,
                        },
                        files: {
                            [readsDataType]: { file: readsCsv, tab: null },
                            [assemblyDataType]: { file: assemblyCsv, tab: null },
                        },
                    }),
                });

                Mocks.mockJsonRpc1Call({
                    url: Config.url('narrative_method_store'),
                    body: /get_method_spec/,
                    response: [ImportFastqSpec, ImportAssemblySpec],
                });

                Mocks.mockJsonRpc1Call({
                    url: Config.url('narrative_method_store'),
                    body: /get_method_full_info/,
                    response: [{}, {}],
                });

                await ImportSetup.setupImportCells([
                    {
                        name: 'some_reads_file.csv',
                        type: 'import_specification',
                    },
                    {
                        name: 'some_assembly_file.csv',
                        type: 'import_specification',
                    },
                ]);
                expect(Jupyter.narrative.insertBulkImportCell).toHaveBeenCalledWith({
                    [readsDataType]: {
                        files: [],
                        appId: uploaders.app_info[readsDataType].app_id,
                        outputSuffix: uploaders.app_info[readsDataType].app_output_suffix,
                        appParameters: processedReadsData,
                    },
                    [assemblyDataType]: {
                        files: [],
                        appId: uploaders.app_info[assemblyDataType].app_id,
                        outputSuffix: uploaders.app_info[assemblyDataType].app_output_suffix,
                        appParameters: processedAssemblyData,
                    },
                });
            });

            // TODO
            xit('should error properly when unable to find bulk specification info', async () => {});

            xit('should error when given multiple bulk spec files with the same type', async () => {});
        });

        describe('setupWebUploadCell tests', () => {
            it('should create a web upload app cell', async () => {
                await ImportSetup.setupWebUploadCell();
                expect(Jupyter.narrative.addAndPopulateApp).toHaveBeenCalledWith(
                    'kb_uploadmethods/upload_web_file',
                    'release',
                    {}
                );
            });
        });
    });
});
