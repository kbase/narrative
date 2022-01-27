define(['kbase/js/widgets/narrative_core/upload/importErrors'], (Errors) => {
    'use strict';

    const user = 'some_user';
    const filePath = (file) => `${user}/${file}`;

    describe('ImportSetupError module', () => {
        it('should have a set of bulk import spec errors', () => {
            expect(Errors.BULK_SPEC_ERRORS).toBeDefined();
        });

        it('should provide a toString function', () => {
            const errors = [
                {
                    type: Errors.BULK_SPEC_ERRORS.NO_FILES,
                },
            ];
            const errText = 'an error happened';
            const error = new Errors.ImportSetupError(errText, errors);
            const result = error.toString();
            expect(result).toContain(error.name);
            expect(result).toContain(errText);
            expect(result).toContain(JSON.stringify(errors));
        });

        describe('Import Setup Error formatting', () => {
            it('should generate a structure of file errors from a list of generated error values', () => {
                // the BULK_SPEC_ERRORS structure isn't used here in order to do a little black-boxing.
                // instead, all error types (except for the purposefully unknowns) are taken straight
                // from the staging service.

                // an example of each type of error, as expected from the staging service for a
                // non-excel file. more detailed tests below. This should just capture the basics
                // and demonstrate filling out the fileErrors
                const notFoundFile = filePath('missing_file.csv'),
                    unparsedFile = filePath('unparseable_file.csv'),
                    badColumnFile = filePath('bad_column_count.csv'),
                    unexpectedFile = filePath('spanish_inquisition.csv'),
                    multiple1File = filePath('assembly1.csv'),
                    multiple2File = filePath('assembly2.csv'),
                    errorText = filePath('multiple errors found!'),
                    cannotParseText = 'cannot parse file',
                    badColumnsText = 'wrong number of columns',
                    multipleSpecsText = 'Data type appears in two importer specification sources',
                    unexpectedText = 'something unexpected happened',
                    stagingErrors = [
                        {
                            type: 'cannot_find_file',
                            file: notFoundFile,
                        },
                        {
                            type: 'cannot_parse_file',
                            file: unparsedFile,
                            tab: null,
                            message: cannotParseText,
                        },
                        {
                            type: 'incorrect_column_count',
                            file: badColumnFile,
                            tab: null,
                            message: badColumnsText,
                        },
                        {
                            type: 'multiple_specifications_for_data_type',
                            file_1: multiple1File,
                            tab_1: null,
                            file_2: multiple2File,
                            tab_2: null,
                            message: multipleSpecsText,
                        },
                        {
                            type: 'unexpected_error',
                            file: unexpectedFile,
                            message: unexpectedText,
                        },
                    ];
                const expectedFileErrors = {
                    [notFoundFile]: ['File not found'],
                    [unparsedFile]: [cannotParseText],
                    [badColumnFile]: [badColumnsText],
                    [multiple1File]: [multipleSpecsText],
                    [multiple2File]: [multipleSpecsText],
                    [unexpectedFile]: [unexpectedText],
                };

                const error = new Errors.ImportSetupError(errorText, stagingErrors);
                expect(error.text).toEqual(errorText);
                expect(error.name).toEqual('ImportSetupError');
                expect(error.errors).toEqual(stagingErrors);
                expect(error.noFileError).toBeFalse();
                expect(error.serverErrors).toEqual([]);
                expect(error.unexpectedErrors).toEqual([]);
                expect(error.fileErrors).toEqual(expectedFileErrors);
            });

            it('should handle excel file errors from multiple tabs', () => {
                const fileName = 'some_file.xlsx',
                    tab1 = 'first_tab',
                    tab2 = 'second_tab',
                    noParseMessage = 'cannot parse',
                    badColumnMessage = 'wrong number of columns',
                    errors = [
                        {
                            type: 'cannot_parse_file',
                            file: fileName,
                            tab: tab1,
                            message: noParseMessage,
                        },
                        {
                            type: 'incorrect_column_count',
                            file: fileName,
                            tab: tab2,
                            message: badColumnMessage,
                        },
                    ];
                const expectedFileErrors = {
                    [`${fileName} tab "${tab1}"`]: [noParseMessage],
                    [`${fileName} tab "${tab2}"`]: [badColumnMessage],
                };

                const error = new Errors.ImportSetupError('an error occurred', errors);
                expect(error.errors).toEqual(errors);
                expect(error.fileErrors).toEqual(expectedFileErrors);
            });

            it('should handle errors for bad data types', () => {
                const badDataType = 'notARealType';
                const fileName = 'badDataType.csv';
                const error = new Errors.ImportSetupError('Data type error', [
                    {
                        type: 'unknown_data_type',
                        dataType: badDataType,
                        file: fileName,
                        tab: null,
                    },
                ]);
                expect(error.fileErrors).toEqual({
                    [fileName]: [`Unknown importer type "${badDataType}"`],
                });
            });

            it('should handle errors for non-bulk data types', () => {
                const badDataType = 'notABulkType';
                const fileName = 'badDataType.csv';
                const error = new Errors.ImportSetupError('Data type error', [
                    {
                        type: 'non_bulk_import_data_type',
                        dataType: badDataType,
                        file: fileName,
                        tab: null,
                    },
                ]);
                expect(error.fileErrors).toEqual({
                    [fileName]: [`Importer type "${badDataType}" is not usable for bulk import`],
                });
            });

            it('should handle server errors', () => {
                const serverErrorMsg = '500 internal service error',
                    serverError = [
                        {
                            type: 'server_error',
                            message: serverErrorMsg,
                        },
                    ];

                const error = new Errors.ImportSetupError('server error!', serverError);
                expect(error.serverErrors).toEqual([serverErrorMsg]);
            });

            it('should generate an error for no files provided', () => {
                const noFiles = [
                    {
                        type: 'no_files_provided',
                    },
                ];
                const text = 'no files!';

                const error = new Errors.ImportSetupError(text, noFiles);
                expect(error.text).toEqual(text);
                expect(error.noFileError).toBeTrue();
            });

            it('should make an unexpected error without a file or message', () => {
                const fileName = 'some_file.csv',
                    msg1 = 'an error message',
                    msg2 = 'another error message',
                    errors = [
                        {
                            type: 'unexpected_error',
                            file: fileName,
                            message: msg1,
                        },
                        {
                            type: 'unexpected_error',
                            message: msg2,
                        },
                    ];

                const error = new Errors.ImportSetupError('weirdo errors', errors);
                expect(error.fileErrors).toEqual({ [fileName]: [msg1] });
                expect(error.unexpectedErrors).toEqual([msg2]);
            });

            const unknownType = 'some_random_error';
            const unknownErrorCases = [
                {
                    error: { type: unknownType },
                    label: 'with only type',
                    expected: `Unknown error of type "${unknownType}"`,
                },
                {
                    error: { type: unknownType, message: 'some error' },
                    label: 'with type and message',
                    expected: 'some error',
                },
                {
                    error: { message: 'some error' },
                    label: 'with only message',
                    expected: 'some error',
                },
                {
                    error: { stuff: 'happened' },
                    label: 'with no usual keys',
                    expected: 'An unexpected error occurred.',
                },
            ];
            unknownErrorCases.forEach((testCase) => {
                it(`should cast an unknown error type to an unrecognized error ${testCase.label}`, () => {
                    spyOn(console, 'error');
                    const error = new Errors.ImportSetupError('unknown', [testCase.error]);
                    expect(error.unexpectedErrors).toEqual([testCase.expected]);
                    expect(console.error).toHaveBeenCalledWith(
                        'Unexpected import setup error!',
                        testCase.error
                    );
                });
            });
        });

        describe('import error dialog for expected error types', () => {
            // This batch uses the BULK_SPEC_ERRORS structure. We're just testing dialog formatting here
            // for the expected error types.

            const SPEC_ERRORS = Errors.BULK_SPEC_ERRORS;

            async function testErrorDialog(error, title, bodyTester) {
                const ret = await error.showErrorDialog(() => {
                    if (title) {
                        expect(document.querySelector('.modal-title').textContent).toBe(title);
                    }
                    if (bodyTester) {
                        const bodyContent = document.querySelector('.modal-body').textContent;
                        bodyTester(bodyContent);
                    }
                    document.querySelector('[data-element="ok"]').click();
                });
                expect(ret).toBeFalse();
            }

            it('should show a custom message when no files are imported', async () => {
                const noFilesError = {
                    type: SPEC_ERRORS.NO_FILES,
                };
                const error = new Errors.ImportSetupError('no files', [noFilesError]);
                await testErrorDialog(error, 'No files provided', (body) => {
                    expect(body).toContain(
                        'No CSV/TSV/Excel files were provided, but "Import Specification" was selected.'
                    );
                });
            });

            it('should show a server error, overriding other errors', async () => {
                const errors = [
                    {
                        type: SPEC_ERRORS.SERVER,
                        message: 'server go boom',
                    },
                    {
                        type: SPEC_ERRORS.CANNOT_PARSE,
                        file: 'some_file.csv',
                        message: 'cannot parse',
                    },
                ];
                const error = new Errors.ImportSetupError('server', errors);
                await testErrorDialog(error, 'Server error', (body) => {
                    expect(body).toMatch(
                        /Server error encountered\. Please retry import\..*server go boom/
                    );
                });
            });

            it('should show errors for a single file, and suggest checking that file', async () => {
                const fileName = 'a_file.csv';
                const message = 'cannot be parsed';
                const error = new Errors.ImportSetupError('error', [
                    {
                        type: SPEC_ERRORS.CANNOT_PARSE,
                        file: fileName,
                        message,
                    },
                ]);
                await testErrorDialog(error, 'Bulk import error', (body) => {
                    expect(body).toMatch(
                        new RegExp(`${fileName}.*${message}.*Check bulk import file ${fileName}`)
                    );
                });
            });

            it('should show errors for multiple files and suggest checking all', async () => {
                const files = ['file1.csv', 'file2.tsv', 'file3.xlsx'];
                const messages = ['error1', 'error2', 'error3'];
                const errors = files.map((fileName, idx) => {
                    return {
                        file: fileName,
                        message: messages[idx],
                        type: SPEC_ERRORS.CANNOT_PARSE,
                    };
                });
                const error = new Errors.ImportSetupError('errored', errors);
                await testErrorDialog(error, 'Multiple errors in bulk import', (body) => {
                    expect(body).toContain('Check bulk import files and retry.');
                    files.forEach((fileName, idx) => {
                        expect(body).toMatch(new RegExp(`${fileName}.*${messages[idx]}`));
                    });
                });
            });

            it('should show both file sections for a multiple specs error', async () => {
                const file1 = ['file1.csv'];
                const file2 = ['file2.csv'];
                const errMsg = 'duplicate data type found';
                const error = new Errors.ImportSetupError('duplicate', [
                    {
                        type: SPEC_ERRORS.MULTIPLE_SPECS,
                        file_1: file1,
                        file_2: file2,
                        tab_1: null,
                        tab_2: null,
                        message: errMsg,
                    },
                ]);
                await testErrorDialog(error, 'Bulk import error', (body) => {
                    expect(body).toMatch(new RegExp(`${file1}.*${errMsg}`));
                    expect(body).toMatch(new RegExp(`${file2}.*${errMsg}`));
                });
            });

            it('should show multiple tabs from an excel file as individual "files"', async () => {
                const fileName = 'some_file.xlsx',
                    tab1 = 'tab1',
                    tab2 = 'tab2',
                    err1 = 'first tab failed',
                    err2 = 'second tab failed';
                const error = new Errors.ImportSetupError('multiple tabs', [
                    {
                        type: SPEC_ERRORS.CANNOT_PARSE,
                        file: fileName,
                        tab: tab1,
                        message: err1,
                    },
                    {
                        type: SPEC_ERRORS.CANNOT_PARSE,
                        file: fileName,
                        tab: tab2,
                        message: err2,
                    },
                ]);
                await testErrorDialog(error, 'Multiple errors in bulk import', (body) => {
                    expect(body).toMatch(new RegExp(`${fileName} tab "${tab1}".*${err1}`));
                    expect(body).toMatch(new RegExp(`${fileName} tab "${tab2}".*${err2}`));
                });
            });

            it('should show unexpected errors with their own header if no others appear', async () => {
                const errors = [
                    {
                        type: SPEC_ERRORS.UNKNOWN,
                        message: 'a random thing happened',
                    },
                    {
                        type: SPEC_ERRORS.UNKNOWN,
                    },
                    {
                        type: 'some_other_type',
                    },
                    {
                        type: 'some_unknown_random_type',
                        message: 'something weird broke',
                    },
                ];

                // test with just one, should see singular text
                const error1 = new Errors.ImportSetupError('unknown', [errors[0]]);
                await testErrorDialog(error1, 'Bulk import error', (body) => {
                    expect(body).toMatch(
                        new RegExp(`Unexpected error found.*${errors[0].message}`)
                    );
                });

                // test with all, should get plural text with list of errors, one of which generated
                const error2 = new Errors.ImportSetupError('unknown2', errors);
                await testErrorDialog(error2, 'Multiple errors in bulk import', (body) => {
                    const prefix = 'Unexpected errors found';
                    const errorList = [
                        errors[0].message,
                        'An unexpected error occurred.',
                        `Unknown error of type "${errors[2].type}"`,
                        errors[2].message,
                    ];
                    expect(body).toMatch(new RegExp(`${prefix}.*${errorList.join('.*')}`));
                });
            });

            it('should show unexpected errors below file errors', async () => {
                const fileName = 'some_file.csv';
                const errors = [
                    {
                        type: SPEC_ERRORS.CANNOT_PARSE,
                        file: fileName,
                        message: 'cannot parse',
                    },
                    {
                        type: SPEC_ERRORS.UNKNOWN,
                        message: 'something wacky went down',
                    },
                ];
                const error = new Errors.ImportSetupError('errors happened', errors);
                await testErrorDialog(error, 'Multiple errors in bulk import', (body) => {
                    expect(body).toMatch(
                        new RegExp(
                            `${fileName}.*${errors[0].message}.*Additional unexpected error found.*${errors[1].message}`
                        )
                    );
                });
            });
        });
    });
});
