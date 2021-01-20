define(['common/ui', 'common/html'], (UI, html) => {
    'use strict';

    function KBError(arg) {
        this.type = arg.type;
        this.message = arg.message;
        this.reason = arg.reason;
        this.original = arg.original;
        this.detail = arg.detail;
        this.info = arg.info;
        this.advice = arg.advice;

        this.blame = arg.blame;
        this.code = arg.code;
        this.suggestion = arg.suggestion;

        this.severity = arg.severity || 'fatal';
    }
    KBError.prototype = new Error();

    function grokError(err) {
        if (err instanceof KBError) {
            return err;
        }
        if (err instanceof Error) {
            return new KBError({
                type: 'js-error',
                name: err.name,
                message: err.message,
                original: err,
            });
        }

        switch (typeof err) {
            case 'string':
                return new KBError({
                    type: 'string-error',
                    message: err,
                    original: err,
                });
            case 'object':
                if (err.error) {
                    // this is a kbase service client style error
                    return new KBError({
                        type: 'kbase-client-error',
                        name: err.error.name,
                        message: err.error.message,
                        detail: err.error.error,
                        original: err,
                    });
                } else if (err.message) {
                    return new KBError({
                        type: 'js-error',
                        name: err.name,
                        message: err.message,
                        original: err,
                    });
                } else {
                    return new KBError({
                        type: 'unknown-error',
                        name: 'Unknown',
                        message: 'An unknown error occurred',
                        original: err,
                    });
                }
            default:
                return new KBError({
                    type: 'unknown-error',
                    name: 'Unknown',
                    message: 'An unknown error occurred',
                    original: err,
                });
        }
    }

    /**
     * This creates and displays a little dialog that shows some error information. It
     * makes 3 tabs: Summary, Details, and Stack Trace
     * Summary contains the preamble and text error.
     * Details contains more details based on the error message.
     * Stack Trace contains the Javascript stack trace included with the Error object.
     * @param {string} title the title of the error dialog (populates the header inside the
     * dialog)
     * @param {string} preamble the "preamble" of the error dialog. This is a
     * string that overall describes what the case is that led to the error.
     * @param {Error} error the error object to be rendered in the error tab.
     */
    function reportCellError(title, preamble, error) {
        const { tag } = html,
            div = tag('div'),
            p = tag('p');

        const ui = UI.make({
            node: document.body,
        });
        ui.showInfoDialog({
            title: 'Error',
            body: div(
                {
                    class: 'error-dialog__body',
                },
                [
                    ui.buildPanel({
                        title: title,
                        type: 'danger',
                        body: ui.buildErrorTabs({
                            preamble: p(preamble),
                            error: error,
                        }),
                    }),
                ]
            ),
        });
    }

    return {
        grokError: grokError,
        KBError: KBError,
        reportCellError: reportCellError,
    };
});
