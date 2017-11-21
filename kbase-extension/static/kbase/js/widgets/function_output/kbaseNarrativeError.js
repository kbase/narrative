/**
 * A simple widget intended to format and display errors that come from
 * the narrative kernel (these are typically back-end errors that
 * occur while running the function). The cause of these errors will
 * probably be either errors with user inputs, or errors while
 * communicating with the KBase API.
 *
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'kbaseAccordion'
], function (
    KBWidget,
    bootstrap,
    $,
    kbaseAccordion
) {
    'use strict';

    return KBWidget({
        name: 'kbaseNarrativeError',
        version: '1.0.0',
        options: {
            error: {
                'msg': 'An error occurred',
                'method_name': 'No method',
                'type': 'Error',
                'severity': 'Catastrophic'
            },
        },
        /**
         * (required) This is the only required function for a KBase Widget.
         * @param {object} options - a structure containing the set of
         * options to be passed to this widget.
         * @private
         */

        init: function (options) {
            this._super(options);
            return this.render();
        },
        render: function () {
            var addRow = function (name, value) {
                return "<tr><td><b>" + name + "</b></td><td>" + value + "</td></tr>";
            };

            // Shamelessly lifted from kbaseNarrativeWorkspace.
            // Thanks Dan!
            var esc = function (s) {
                return s;
                // return s.replace(/'/g, "&apos;")
                //         .replace(/"/g, "&quot;")
                //         .replace(/</g, "&gt;")
                //         .replace(/>/g, "&lt;");
            };

            // Reformat a TB as a list
            var format_tb = function (err) {
                var s = "\n";
                var ind = ""; // keep in case change of mind
                if (err.traceback === undefined) {
                    s += "No traceback available.\n";
                } else if (err.traceback instanceof Array) {
                    s += "Traceback (most recent call last):\n";
                    var tb = err.traceback;
                    for (var i = 0, ctr = 0; i < tb.length; i++) {
                        var entry = tb[i];
                        if (entry.function == "__call__")
                            continue;  // ignore wrapper
                        ctr++;
                        var txt = "";
                        if (entry.function || entry.line) {
                            var txt = ctr + ") ";
                            txt += "in '" + entry.function + "' line " + entry.line + ": ";
                        }
                        txt += entry.text;
                        s += ind + txt + "\n";
                    }
                } else if (err.traceback instanceof Object) {
                    for (var i in err.traceback) {
                        s += JSON.stringify(err.traceback[i]);
                    }
                } else {
                    s += err.traceback;
                }
                return s;
            };

            var $errorHead = $('<div>')
                .addClass('alert alert-danger')
                .append(this.options.error.msg);

            var $errorTable = $('<table>')
                .addClass('table table-bordered')
                .css({'margin-right': 'auto', 'margin-left': 'auto'})
                .append(addRow("Function", esc(this.options.error.method_name)))
                .append(addRow("Error Type", esc(this.options.error.type)))
                .append(addRow("Severity", esc(this.options.error.severity)));

            var $stackTraceAccordion = $('<div>');

            this.$elem.append($errorHead)
                .append($errorTable)
                .append($stackTraceAccordion);

            new kbaseAccordion($stackTraceAccordion, {
                elements: [{
                    title: 'Detailed Error Message',
                    body: $('<pre>')
                        .addClass('kb-err-msg')
                        .append(esc(this.options.error.msg))
                        .append(format_tb(this.options.error)),
                }]
            }
            );
            return this;
        },
    });
});
