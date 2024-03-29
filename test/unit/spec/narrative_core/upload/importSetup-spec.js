define([
    'kbase/js/widgets/narrative_core/upload/importSetup',
    'kbase/js/widgets/narrative_core/upload/importErrors',
    'base/js/namespace',
    'narrativeConfig',
    'narrativeMocks',
    'testUtil',
    'json!/test/data/kb_uploadmethods.import_fastq_interleaved_as_reads_from_staging.spec.json',
    'json!/test/data/kb_uploadmethods.import_fasta_as_assembly_from_staging.spec.json',
], (ImportSetup, Errors, Jupyter, Config, Mocks, TestUtil, ImportFastqSpec, ImportAssemblySpec) => {
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

            function stubBulkSpecificationRequest(status, statusText, response) {
                jasmine.Ajax.stubRequest(
                    new RegExp(`${stagingServiceUrl}/bulk_specification`)
                ).andReturn({
                    status,
                    statusText,
                    contentType: 'text/plain',
                    responseHeaders: '',
                    responseText: JSON.stringify(response),
                });
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

                stubBulkSpecificationRequest(200, 'success', {
                    types: {
                        [readsDataType]: importReadsData,
                        [assemblyDataType]: importAssemblyData,
                    },
                    files: {
                        [readsDataType]: { file: readsCsv, tab: null },
                        [assemblyDataType]: { file: assemblyCsv, tab: null },
                    },
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

            describe('import cell staging area error tests', () => {
                /**
                 * stagingResponse is optional. If present, this will start with mocking a call to the
                 * bulk_specification endpoint of the staging area, expecting a 200 response with the
                 * given data.
                 * @param {string} fileName
                 * @param {Object} stagingResponse expected response from a happy staging area call
                 */
                async function testWithExpectedImportErrors(fileNames, stagingResponse) {
                    if (stagingResponse) {
                        stubBulkSpecificationRequest(200, 'ok', stagingResponse);
                    }

                    const importInputs = fileNames.map((fileName) => ({
                        name: fileName,
                        type: 'import_specification',
                    }));
                    await expectAsync(
                        ImportSetup.setupImportCells(importInputs)
                    ).toBeRejectedWithError(Errors.ImportSetupError);
                }

                it('should error properly when unable to find bulk specification info', async () => {
                    // see https://github.com/kbase/staging_service/tree/develop#error-response-12
                    // for error details
                    const filename = 'xsv_input.csv';
                    stubBulkSpecificationRequest(404, 'not found', {
                        errors: [
                            {
                                type: 'cannot_find_file',
                                file: filename,
                            },
                        ],
                    });
                    await testWithExpectedImportErrors([filename]);
                });

                const wrongDataTypes = [
                    {
                        dataType: 'not_a_real_datatype',
                        label: 'bad',
                    },
                    {
                        dataType: 'media',
                        label: 'non-bulk',
                    },
                ];
                wrongDataTypes.forEach((testCase) => {
                    it(`should error when retrieving data with a ${testCase.label} data type`, async () => {
                        const fileName = `${testCase.dataType}_data.csv`;
                        const stagingResponse = {
                            types: {
                                [testCase.dataType]: [{ some: 'input' }],
                            },
                            files: {
                                [testCase.dataType]: {
                                    file: fileName,
                                    tab: null,
                                },
                            },
                        };
                        await testWithExpectedImportErrors([fileName], stagingResponse);
                    });
                });

                it('should error when receiving the same type of dataType from splitting service calls', async () => {
                    // really, the only way this gets triggered is when two conditions happen:
                    // 1. there are enough files, or files with long enough path names, to require multiple GET calls
                    // 2. two or more of those files have data for the same data type
                    // so let's play with some crazy long, generated file names. The allowed URL length
                    // is 2048 characters, so a couple files of length ~1500 should do it, right?
                    // Mocking calls to the service will need to be done manually here, too.
                    const file1 = `${'a'.repeat(1500)}.csv`,
                        file2 = `${'b'.repeat(1500)}.csv`,
                        dataType = 'assembly',
                        response1 = {
                            types: {
                                [dataType]: { some: 'data' },
                            },
                            files: {
                                [dataType]: { file: file1, tab: null },
                            },
                        },
                        response2 = {
                            types: {
                                [dataType]: { some: 'more_data' },
                            },
                            files: {
                                [dataType]: { file: file2, tab: null },
                            },
                        };

                    jasmine.Ajax.stubRequest(
                        `${stagingServiceUrl}/bulk_specification/?files=${file1}`
                    ).andReturn({
                        status: 200,
                        statusText: 'ok',
                        contentType: 'text/plain',
                        responseHeaders: '',
                        responseText: JSON.stringify(response1),
                    });
                    jasmine.Ajax.stubRequest(
                        `${stagingServiceUrl}/bulk_specification/?files=${file2}`
                    ).andReturn({
                        status: 200,
                        statusText: 'ok',
                        contentType: 'text/plain',
                        responseHeaders: '',
                        responseText: JSON.stringify(response2),
                    });

                    const importInputs = [
                        {
                            name: file1,
                            type: 'import_specification',
                        },
                        {
                            name: file2,
                            type: 'import_specification',
                        },
                    ];

                    let error;
                    try {
                        await ImportSetup.setupImportCells(importInputs);
                    } catch (e) {
                        error = e;
                    }
                    // make sure we get the right list, and that the fileErrors
                    // look like : { file1: [error], file2: [error] }
                    expect(error).toEqual(jasmine.any(Errors.ImportSetupError));
                    [file1, file2].forEach((fileName) => {
                        expect(error.fileErrors[fileName]).toEqual(jasmine.any(Array));
                    });
                });
            });
            describe('xsv column / app parameter mismatch error tests', () => {
                const dataType = 'assembly';
                const paramIds = [
                    'staging_file_subdir_path',
                    'assembly_name',
                    'type',
                    'min_contig_length',
                ];

                /**
                 * Generates a batch of assembly data that gets returned from a mocked staging
                 * service bulk specification call. Can optionally set extra data columns,
                 * or missing data columns.
                 * This follows the parameters in the Assembly uploader app spec, which has
                 * 4 parameter ids: staging_file_subdir_path, assembly_name, type, min_contig_length.
                 * Note that this data is completely meaningless and shouldn't be used for testing
                 * intended inputs - this is generator for making sure that extra/missing column
                 * errors are trapped correctly.
                 * @param {Integer} extraCols should be 0 or greater
                 * @param {Integer} missingCols should be between 0 - 4
                 * @param {Integer} numRows should be at least 1
                 * @param {String} file
                 * @param {String|null} tab
                 * @returns {Object} keys:
                 *    data - the data to be returned from the staging service
                 *    errorMsgs - the list of file errors expected to be seen (not necessarily in the same order)
                 */
                function generateAssemblyData(extraCols, missingCols, numRows, file, tab) {
                    const data = [],
                        errorMsgs = [];
                    let dataParamIds = TestUtil.JSONcopy(paramIds);
                    if (missingCols > 0) {
                        dataParamIds.slice(dataParamIds.length - missingCols).forEach((paramId) => {
                            errorMsgs.push(
                                `Required column "${paramId}" for importer type "${dataType}" appears to be missing`
                            );
                        });
                        dataParamIds = dataParamIds.slice(0, dataParamIds.length - missingCols);
                    }
                    if (extraCols > 0) {
                        for (let extra = 0; extra < extraCols; extra++) {
                            const extraCol = `extraCol_${extra + 1}`;
                            dataParamIds.push(extraCol);
                            errorMsgs.push(
                                `Column with id "${extraCol}" is not known for importer type "${dataType}"`
                            );
                        }
                    }
                    for (let i = 0; i < numRows; i++) {
                        data.push(
                            dataParamIds.reduce((row, paramId) => {
                                row[paramId] = `value_${i}`;
                                return row;
                            }, {})
                        );
                    }
                    return {
                        data: {
                            types: {
                                [dataType]: data,
                            },
                            files: {
                                [dataType]: { file, tab },
                            },
                        },
                        errorMsgs,
                    };
                }

                const testCases = [
                    {
                        label: 'missing column',
                        extraCols: 0,
                        missingCols: 1,
                    },
                    {
                        label: 'missing multiple columns',
                        extraCols: 0,
                        missingCols: 3,
                    },
                    {
                        label: 'extra column',
                        extraCols: 1,
                        missingCols: 0,
                    },
                    {
                        label: 'multiple extra columns',
                        extraCols: 3,
                        missingCols: 0,
                    },
                    {
                        label: 'missing one column, one extra column',
                        extraCols: 1,
                        missingCols: 1,
                    },
                    {
                        label: 'all columns replaced',
                        extraCols: 4,
                        missingCols: 4,
                    },
                ];
                testCases.forEach((testCase) => {
                    it(`should show an error if data is returned with ${testCase.label}`, async () => {
                        const fileName = 'dataFile.csv';
                        const data = generateAssemblyData(
                            testCase.extraCols,
                            testCase.missingCols,
                            5,
                            fileName,
                            null
                        );
                        expect(testCase.extraCols).toEqual(testCase.extraCols);
                        stubBulkSpecificationRequest(200, 'ok', data.data);

                        Mocks.mockJsonRpc1Call({
                            url: Config.url('narrative_method_store'),
                            body: /get_method_spec/,
                            response: [ImportAssemblySpec],
                        });

                        Mocks.mockJsonRpc1Call({
                            url: Config.url('narrative_method_store'),
                            body: /get_method_full_info/,
                            response: [{}],
                        });

                        let error;
                        try {
                            await ImportSetup.setupImportCells([
                                { name: fileName, type: 'import_specification' },
                            ]);
                        } catch (e) {
                            error = e;
                        }

                        // make sure we get the right list, and that the fileErrors
                        // look like : { file1: [error], file2: [error] }
                        expect(error).toEqual(jasmine.any(Errors.ImportSetupError));
                        const fileErrors = error.fileErrors[fileName];
                        expect(fileErrors).toEqual(jasmine.arrayWithExactContents(data.errorMsgs));
                    });
                });
            });
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
