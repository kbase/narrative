define([
    '../../../../../../narrative/nbextensions/bulkImportCell/util',
    'common/props',
    'common/spec',
    'testUtil',
    '/test/data/testBulkImportObj',
], (Util, Props, Spec, TestUtil, TestBulkImportObject) => {
    'use strict';

    const testFileType = 'someFileType';
    const testAppId = 'kb_uploadmethods/import_fastq_sra_as_reads_from_staging';
    const filePathIds = ['fastq_fwd_staging_file_name', 'fastq_rev_staging_file_name', 'name'];
    const paramIds = [
        'import_type',
        'sequencing_tech',
        'single_genome',
        'interleaved',
        'read_orientation_outward',
        'insert_size_std_dev',
        'insert_size_mean',
    ];
    // all of these tests use the 'kb_uploadmethods/import_fastq_sra_as_reads_from_staging'
    // spec as given in test/data/testBulkImportObj
    /**
     * This builds a quick and dirty test "model" around one or more instances of the same app
     * spec. It just gets used multiple times (we're testing whether the model validates, not the
     * various apps).
     * @param {Array} inputs - an object where key is the fileType, and value is an array of file names
     * @returns {Object} model - a Props object with data matching the file names and parameters
     *  from the test app spec
     */
    function buildModel(fileInputs) {
        const fileTypes = Object.keys(fileInputs);
        // set up inputs
        const params = {
                import_type: 'SRA',
                insert_size_mean: null,
                insert_size_std_dev: null,
                interleaved: 0,
                read_orientation_outward: 0,
                sequencing_tech: 'Illumina',
                single_genome: 1,
            },
            inputs = {},
            appParams = {},
            fileParamIds = {},
            otherParamIds = {};
        fileTypes.forEach((fileType) => {
            const files = fileInputs[fileType];
            fileParamIds[fileType] = Object.assign([], filePathIds);
            otherParamIds[fileType] = Object.assign([], paramIds);
            inputs[fileType] = {
                appId: testAppId,
                files,
            };
            const filePaths = files.map((filename) => {
                return {
                    fastq_fwd_staging_file_name: filename,
                    fastq_rev_staging_file_name: filename,
                    name: filename,
                };
            });
            appParams[fileType] = {
                filePaths,
                params: Object.assign({}, params),
            };
        });
        return Props.make({
            data: {
                app: { fileParamIds, otherParamIds },
                inputs,
                params: appParams,
            },
            onUpdate: () => {},
        });
    }

    describe('BulkImportCell Utility tests', () => {
        let spec;
        beforeAll(() => {
            spec = Spec.make({ appSpec: TestBulkImportObject.app.specs[testAppId] });
        });

        afterEach(() => {
            TestUtil.clearRuntime();
        });

        describe('evaluateAppConfig tests', () => {
            // happy path tests with >= 1 file path sets
            [1, 2, 5].forEach((fileCount) => {
                it(`should return "complete" with ${fileCount} file paths in a ready state`, async () => {
                    // Array interpolation cleverness from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
                    const files = Array.from({ length: fileCount }, (v, x) => `file${x + 1}`);
                    const fileInputs = {};
                    fileInputs[testFileType] = files;
                    const model = buildModel(fileInputs);
                    const status = await Util.evaluateAppConfig(
                        paramIds,
                        model.getItem(['params', testFileType, 'params']),
                        {},
                        filePathIds,
                        model.getItem(['params', testFileType, 'filePaths']),
                        Array.from({ length: fileCount }, () => ({})),
                        spec
                    );
                    expect(status).toEqual('complete');
                });
            });

            // unhappy file path row tests
            [
                { label: 'empty', data: [] },
                { label: 'multiple missing', data: [{ fastq_rev_staging_file_name: 'rev1' }] },
                {
                    label: 'single missing',
                    data: [{ fastq_rev_staging_file_name: 'rev2', name: 'name2' }],
                },
                {
                    label: 'multiple null required',
                    data: [
                        {
                            fastq_fwd_staging_file_name: null,
                            fastq_rev_staging_file_name: 'rev3',
                            name: null,
                        },
                    ],
                },
                {
                    label: 'single null required',
                    data: [
                        {
                            fastq_fwd_staging_file_name: null,
                            fastq_rev_staging_file_name: 'rev4',
                            name: 'name4',
                        },
                    ],
                },
            ].forEach((testCase) => {
                it(`should return "incomplete" with ${testCase.label} filePath inputs`, async () => {
                    const fileInputs = {};
                    fileInputs[testFileType] = [];
                    const model = buildModel(fileInputs);
                    model.setItem(['params', testFileType, 'filePaths'], testCase.data);
                    const status = await Util.evaluateAppConfig(
                        paramIds,
                        model.getItem(['params', testFileType, 'params']),
                        {},
                        filePathIds,
                        model.getItem(['params', testFileType, 'filePaths']),
                        [{}],
                        spec
                    );
                    expect(status).toEqual('incomplete');
                });
            });

            [
                { label: 'empty', data: { remove: paramIds } },
                { label: 'a single missing required', data: { remove: ['import_type'] } },
                {
                    label: 'multiple missing required',
                    data: { remove: ['import_type', 'sequencing_tech'] },
                },
                { label: 'a single null required', data: { alter: { import_type: null } } },
                {
                    label: 'multiple null required',
                    data: { alter: { import_type: null, sequencing_tech: null } },
                },
                { label: 'an incorrect value type', data: { alter: { insert_size_mean: 'wat' } } },
            ].forEach((testCase) => {
                it(`should return "incomplete" with ${testCase.label} param inputs`, async () => {
                    const fileInputs = {};
                    fileInputs[testFileType] = ['some_file'];
                    const model = buildModel(fileInputs);
                    const defaultParams = model.getItem(['params', testFileType, 'params']);
                    let testParams = defaultParams;
                    if ('remove' in testCase.data) {
                        testCase.data.remove.forEach((key) => {
                            delete testParams[key];
                        });
                    }
                    if ('alter' in testCase.data) {
                        testParams = Object.assign(testParams, testCase.data.alter);
                    }
                    model.setItem(['params', testFileType, 'params'], testParams);
                    const filePathValues = model.getItem(['params', testFileType, 'filePaths']);
                    const status = await Util.evaluateAppConfig(
                        paramIds,
                        model.getItem(['params', testFileType, 'params']),
                        {},
                        filePathIds,
                        model.getItem(['params', testFileType, 'filePaths']),
                        Array.from({ length: filePathValues.length }, () => ({})),
                        spec
                    );
                    expect(status).toEqual('incomplete');
                });
            });
        });

        describe('evaluateConfigReadyState tests', () => {
            // happy path test
            let specs;
            beforeAll(() => {
                specs = {};
                specs[testAppId] = spec;
            });

            [
                {
                    label: 'complete',
                    files: ['file1', 'file2'],
                },
                {
                    label: 'incomplete',
                    files: [],
                },
            ].forEach((testCase) => {
                it(`should return ${testCase.label} for a single file type`, async () => {
                    const fileInputs = {};
                    fileInputs[testFileType] = testCase.files;
                    const model = buildModel(fileInputs);
                    const readyState = await Util.evaluateConfigReadyState(model, specs);
                    const expected = {};
                    expected[testFileType] = testCase.label;
                    expect(readyState).toEqual(expected);
                });
            });

            [
                {
                    label: 'complete',
                    fileTypeCount: 2,
                    fileCounts: [2, 2],
                    result: ['complete', 'complete'],
                },
                {
                    label: 'incomplete',
                    fileTypeCount: 2,
                    fileCounts: [0, 2],
                    result: ['incomplete', 'complete'],
                },
                {
                    label: 'incomplete',
                    fileTypeCount: 2,
                    fileCounts: [2, 0],
                    result: ['complete', 'incomplete'],
                },
                {
                    label: 'incomplete',
                    fileTypeCount: 2,
                    fileCounts: [0, 0],
                    result: ['incomplete', 'incomplete'],
                },
            ].forEach((testCase) => {
                it(`should return ${testCase.result} for multiple file types`, async () => {
                    const fileInputs = {};
                    const expected = {};
                    for (let i = 0; i < testCase.fileTypeCount; i++) {
                        const fileType = `fileType${i}`;
                        const count = testCase.fileCounts[i];
                        fileInputs[fileType] = Array.from(
                            { length: count },
                            (v, x) => `file${i}_${x + 1}`
                        );
                        expected[fileType] = testCase.result[i];
                    }
                    const model = buildModel(fileInputs);

                    const readyState = await Util.evaluateConfigReadyState(model, specs);
                    expect(readyState).toEqual(expected);
                });
            });
        });
    });
});
