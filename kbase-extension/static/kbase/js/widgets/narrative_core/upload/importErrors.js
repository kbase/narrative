define(['common/ui', 'common/html', 'util/string'], (UI, html, StringUtil) => {
    'use strict';

    const BULK_SPEC_ERRORS = {
        NOT_FOUND: 'cannot_find_file',
        CANNOT_PARSE: 'cannot_parse_file',
        INCORRECT_COLUMN_COUNT: 'incorrect_column_count',
        MULTIPLE_SPECS: 'multiple_specifications_for_data_type',
        NO_FILES: 'no_files_provided',
        UNKNOWN: 'unexpected_error',
        SERVER: 'server_error',
        UNKNOWN_TYPE: 'unknown_data_type',
        NOT_BULK_TYPE: 'non_bulk_import_data_type',
    };

    const DEFAULT_MESSAGES = {
        UNKNOWN: 'An unexpected error occurred.',
        FILE_NOT_FOUND: 'File not found',
    };

    const TEMPLATE_MESSAGES = {
        UNKNOWN_TYPE: (dataType) => `Unknown importer type "${dataType}"`,
        NOT_BULK_TYPE: (dataType) => `Importer type "${dataType}" is not usable for bulk import`,
    };

    /**
     * Expect to be given an Array of errors, each of which is a key-value pair.
     * Each object in this structure can have the following fields,
     * as taken from the Staging Service designs:
     *   type, (this is the only required one, rest are dependent on it), should be one
     *      of the strings in BULK_SPEC_ERRORS, or will be treated as 'unexpected_error'
     *   file,
     *   tab,
     *   message,
     *   file_1,
     *   file_2,
     *   tab_1,
     *   tab_2,
     *   code
     */
    class ImportSetupError extends Error {
        /**
         * Builds the Error object. This pre-processes the errors to the following properties:
         *   fileErrors - keyed on the filename and tab (where appropriate), each value is
         *      a list of error strings
         *   serverErrors - a list of error strings
         *   unexpectedErrors - a list of error strings
         *   noFileError - true if the BULK_SPEC_ERRORS.NO_FILES error type shows up
         *      note that this should be the only error that appears when returned from the Staging Service
         * @param {string} text string for the error
         * @param {Object} errors Array of error objects, each is a key-value pair, with keys listed above
         */
        constructor(text, errors) {
            super(text);
            this.errors = errors;
            this.name = 'ImportSetupError';
            this.text = text;
            this.fileErrors = {};
            this.serverErrors = [];
            this.unexpectedErrors = [];
            this.noFileError = false;
            this._processErrors();
        }

        toString() {
            return `${this.name} - ${this.text}: ${JSON.stringify(this.errors)}`;
        }

        /**
         * This takes the list of errors, sorts, and groups them by file type where possible.
         * The goal is to convert from a list of errors of various formats to something more
         * easily printable with some minor formatting.
         *
         * i.e. from:
         * [{
         *   type: 'cannot_find_file',
         *   file: 'some_file.csv',
         * }]
         * to:
         * {
         *   some_file.csv: ['not found']
         * }
         * or, more complicated:
         * [{
         *   type: 'incorrect_column_count',
         *   file: 'file1.xls',
         *   tab: 'tab_1',
         *   message: 'wrong column count, missing <some column>'
         * }, {
         *   type: 'multiple_specifications_for_data_type',
         *   file_1: 'file1.xls',
         *   tab_1: 'tab_1',
         *   file_2: 'file2.csv',
         *   tab_2: null,
         *   message: 'duplicate specification found'
         * }, {
         *   type: 'unexpected_error',
         *   message: 'an unexpected error occurred'
         * }]
         * to:
         * {
         *   'file1.xls tab "tab_1"': [
         *     'wrong column count, missing <some column>',
         *     'duplicate specification found in file2.csv'
         *   ],
         *   'file2.csv': [
         *     'duplicate specification found in file1.xls tab "tab_1"'
         *   ],
         * }
         */
        _processErrors() {
            // a little helper to handle file error formatting
            const addFileError = (error) => {
                let fileKey = error.file;
                if (error.tab) {
                    fileKey += ` tab "${error.tab}"`;
                }
                if (!this.fileErrors[fileKey]) {
                    this.fileErrors[fileKey] = [];
                }
                this.fileErrors[fileKey].push(error.message);
            };

            this.errors.forEach((error) => {
                switch (error.type) {
                    case BULK_SPEC_ERRORS.CANNOT_PARSE:
                    case BULK_SPEC_ERRORS.INCORRECT_COLUMN_COUNT:
                        addFileError(error);
                        break;
                    case BULK_SPEC_ERRORS.NOT_FOUND:
                        addFileError(
                            Object.assign({ message: DEFAULT_MESSAGES.FILE_NOT_FOUND }, error)
                        );
                        break;
                    case BULK_SPEC_ERRORS.MULTIPLE_SPECS:
                        addFileError({
                            file: error.file_1,
                            tab: error.tab_1,
                            message: error.message,
                        });
                        addFileError({
                            file: error.file_2,
                            tab: error.tab_2,
                            message: error.message,
                        });
                        break;
                    case BULK_SPEC_ERRORS.NOT_BULK_TYPE:
                        addFileError(
                            Object.assign(
                                {
                                    message: TEMPLATE_MESSAGES.NOT_BULK_TYPE(error.dataType),
                                },
                                error
                            )
                        );
                        break;
                    case BULK_SPEC_ERRORS.UNKNOWN_TYPE:
                        addFileError(
                            Object.assign(
                                {
                                    message: TEMPLATE_MESSAGES.UNKNOWN_TYPE(error.dataType),
                                },
                                error
                            )
                        );
                        break;
                    case BULK_SPEC_ERRORS.NO_FILES:
                        this.noFileError = true;
                        break;
                    case BULK_SPEC_ERRORS.SERVER:
                        this.serverErrors.push(error.message);
                        break;
                    case BULK_SPEC_ERRORS.UNKNOWN:
                        if (!error.message) {
                            error.message = DEFAULT_MESSAGES.UNKNOWN;
                        }
                        if (error.file) {
                            addFileError(error);
                        } else {
                            this.unexpectedErrors.push(error.message);
                        }
                        break;
                    default:
                        if (error.message) {
                            this.unexpectedErrors.push(error.message);
                        } else if (error.type) {
                            this.unexpectedErrors.push(`Unknown error of type "${error.type}"`);
                        } else {
                            this.unexpectedErrors.push(DEFAULT_MESSAGES.UNKNOWN);
                        }
                        console.error('Unexpected import setup error!', error);
                        break;
                }
            });
        }

        _formatErrors() {
            const tag = html.tag,
                div = tag('div'),
                ul = tag('ul'),
                li = tag('li'),
                b = tag('b');

            let title = 'Bulk import error';
            let body = '';
            // some branching based on how errors were parsed out.

            if (this.noFileError) {
                return {
                    title: 'No files provided',
                    body: 'No CSV/TSV/Excel files were provided, but "Import Specification" was selected.',
                };
            } else if (this.serverErrors.length) {
                return {
                    title: 'Server error',
                    body: div([
                        'Server error encountered. Please retry import.',
                        ul(this.serverErrors.map((err) => li(StringUtil.escape(err)))),
                    ]),
                };
            } else {
                let footer = '';
                const numFiles = Object.keys(this.fileErrors).length;

                const fileErrorText = Object.entries(this.fileErrors).map(([fileName, errors]) => {
                    const s = errors.length > 1 ? 's' : '';
                    const header = `Error${s} in ${b(StringUtil.escape(fileName))}`;
                    return div([header, ul(errors.map((err) => li(StringUtil.escape(err))))]);
                });

                if (numFiles === 1) {
                    footer = `Check bulk import file ${b(
                        StringUtil.escape(Object.keys(this.fileErrors)[0])
                    )} and retry. `;
                } else if (numFiles > 1) {
                    footer = 'Check bulk import files and retry. ';
                }
                footer += 'Click OK to return to Staging.';

                let unknownErrors = '';
                if (this.unexpectedErrors.length) {
                    const s = this.unexpectedErrors.length > 1 ? 's' : '';
                    const prefix = fileErrorText.length ? 'Additional u' : 'U';
                    const unknownString = `${prefix}nexpected error${s} found`;
                    unknownErrors = div([
                        unknownString,
                        ul([this.unexpectedErrors.map((err) => li(StringUtil.escape(err)))]),
                    ]);
                }

                body = div([fileErrorText, unknownErrors, footer]);

                if (this.errors.length > 1) {
                    title = 'Multiple errors in bulk import';
                }
            }

            return { title, body };
        }

        /**
         * Shows an error dialog composed of the various errors used to initialize this object. It
         * can optionally run an extra function once the dialog gets rendered.
         * @param {function} doThisFirst - a function to run as soon as the dialog opens, before it gets closed
         * @returns {Promise} a Promise that resolves to false when the user closes the dialog.
         */
        showErrorDialog(doThisFirst) {
            const { title, body } = this._formatErrors();

            return UI.showInfoDialog({
                title,
                body,
                okLabel: 'OK',
                bsClass: 'danger',
                doThisFirst,
            });
        }
    }

    return {
        ImportSetupError,
        BULK_SPEC_ERRORS,
    };
});
