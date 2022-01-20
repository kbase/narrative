define(['common/ui', 'common/html'], (UI, html) => {
    'use strict';

    const BULK_SPEC_ERRORS = {
        NOT_FOUND: 'cannot_find_file',
        CANNOT_PARSE: 'cannot_parse_file',
        INCORRECT_COLUMN_COUNT: 'incorrect_column_count',
        MULTIPLE_SPECS: 'multiple_specifications_for_data_type',
        NO_FILES: 'no_files_provided',
        UNKNOWN: 'unexpected_error',
        SERVER: 'server_error',
    };

    /**
     *
     */
    class ImportSetupError extends Error {
        /**
         * error structure = key-value pairs. all values are strings, keys are one or more of:
         * {
         *   type, (only required one, rest are dependent on it)
         *   file,
         *   tab,
         *   message,
         *   file_1,
         *   file_2,
         *   tab_1,
         *   tab_2,
         *   code
         * }
         * @param {string} text
         * @param {Object} errors
         */
        constructor(text, errors) {
            super(text);
            this.errors = errors;
            this.name = 'ImportSetupError';
            this.text = text;
            this._processErrors();
        }

        toString() {
            return `${this.name} - ${this.text}: ${JSON.stringify(this.errors)}`;
        }

        /**
         * Should take the list of errors, sort, and group them by file type as possible.
         * Goal = go from list of errors of various formats to something more
         * printable with some formatting.
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
            // a little lambda-ish to handle file error formatting
            const addFileError = (error) => {
                let fileKey = error.file;
                if (error.tab) {
                    fileKey += ` tab ${error.tab}`;
                }
                if (!this.fileErrors[fileKey]) {
                    this.fileErrors[fileKey] = [];
                }
                this.fileErrors[fileKey].push(error.message);
            };

            this.fileErrors = {};
            this.serverErrors = [];
            this.unexpectedErrors = [];
            this.noFileError = false;
            this.totalErrors = 0;
            this.errors.forEach((error) => {
                switch (error.type) {
                    case BULK_SPEC_ERRORS.NOT_FOUND:
                    case BULK_SPEC_ERRORS.CANNOT_PARSE:
                    case BULK_SPEC_ERRORS.INCORRECT_COLUMN_COUNT:
                        addFileError(error);
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
                    case BULK_SPEC_ERRORS.NO_FILES:
                        this.noFileError = true;
                        break;
                    case BULK_SPEC_ERRORS.UNKNOWN:
                        if (error.file) {
                            addFileError(error);
                        } else {
                            this.unexpectedErrors.push(error.message);
                        }
                        break;
                    case BULK_SPEC_ERRORS.SERVER:
                        this.serverErrors.push(error.message);
                        break;
                    default:
                        console.error('unknown file import error', error);
                        break;
                }
                this.totalErrors++;
            });
        }

        _formatErrors() {
            const div = html.tag('div'),
                ul = html.tag('ul'),
                li = html.tag('li');

            let title = 'OMG ERROR';
            let body = '';
            // some branching based on how errors were parsed out.

            if (this.noFileError) {
                title = 'No files given';
                body =
                    'No files were given, though the bulk import specification was chosen. Blame Gavin.';
            } else if (this.serverErrors.length) {
                title = 'Server error';
                body = div([
                    'Server error encountered. Please retry import.',
                    ul(this.serverErrors.map((err) => li(err))),
                ]);
            } else {
                const fileErrorText = Object.entries(this.fileErrors).map(([fileName, errors]) => {
                    const s = errors.length > 1 ? 's' : '';
                    const header = `Error${s} in ${fileName}`;
                    return div([header, ul(errors.map((err) => li(err)))]);
                });

                let unknownErrors = '';
                if (this.unexpectedErrors.length) {
                    const s = this.unexpectedErrors.length > 1 ? 's' : '';
                    const prefix = fileErrorText.length ? 'Additional u' : 'U';
                    const unknownString = `${prefix}nexpected error${s} found`;
                    unknownErrors = div([
                        unknownString,
                        ul([this.unexpectedErrors.map((err) => li(err))]),
                    ]);
                }

                body = div([fileErrorText, unknownErrors]);
            }

            if (this.totalErrors > 1) {
                title = 'Multiple Errors in bulk import';
            }

            return [title, body];
        }

        showErrorDialog() {
            const [title, body] = this._formatErrors();

            UI.showInfoDialog({
                title,
                body,
                okLabel: 'OK',
                bsClass: 'danger',
            });
        }
    }

    class SpreadsheetFetchError extends ImportSetupError {
        constructor(errors) {
            super('Error while fetching CSV/TSV/Excel import data', errors);
            this.name = 'SpreadsheetFetchError';
        }
    }

    class SpreadsheetValidationError extends ImportSetupError {
        constructor(errors) {
            super('Error while validating CSV/TSV/Excel import data', errors);
            this.name = 'SpreadsheetValidationError';
        }
    }

    return {
        SpreadsheetFetchError,
        SpreadsheetValidationError,
        ImportSetupError,
        BULK_SPEC_ERRORS,
    };
});
