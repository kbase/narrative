/*global define,Jupyter,window*/
/*jslint white: true,browser:true*/
// Bind all page buttons right at startup.
define(
    [
        'kbwidget',
        'bootstrap',
        'jquery',
        'narrativeConfig',
        'common/runtime',
        'kbaseNarrativeSharePanel'
    ],
    function(
        KBWidget,
        bootstrap,
        $,
        Config,
        Runtime,
        kbaseNarrativeSharePanel
    ) {
        'use strict';

        function loadDomEvents() {

            $(document).on('workspaceIdQuery.Narrative', function(e, callback) {
                if (callback) {
                    callback(window.workspaceId);
                }
            });

            // bind menubar buttons
            $('#kb-save-btn').click(function() {
                if (Jupyter && Jupyter.notebook) {
                    var narrName = Jupyter.notebook.notebook_name;
                    // we do not allow users to leave their narratives untitled
                    if (narrName.trim().toLowerCase() === 'untitled' || narrName.trim().length === 0) {
                        Jupyter.save_widget.rename_notebook({ notebook: Jupyter.notebook }); //"Please name your Narrative before saving.", false);
                    } else {
                        Jupyter.narrative.saveNarrative();
                    }
                }
            });
            $('#kb-kernel-int-btn').click(function() {
                if (Jupyter && Jupyter.notebook && Jupyter.notebook.kernel) {
                    Jupyter.notebook.kernel.interrupt();
                }
            });
            $('#kb-kernel-ref-btn').click(function() {
                if (Jupyter && Jupyter.notebook && Jupyter.notebook.kernel) {
                    Jupyter.notebook.kernel.restart();
                }
            });
            $('#kb-kernel-rec-btn').click(function() {
                if (Jupyter && Jupyter.notebook && Jupyter.notebook.kernel) {
                    Jupyter.notebook.kernel.reconnect();
                }
            });
            $('#kb-del-btn').click(function() {
                if (Jupyter && Jupyter.notebook) {
                    Jupyter.notebook.delete_cell();
                }
            });
            $('#kb-jira-btn').attr('href', Config.url('submit_jira_ticket') + '%20' + Config.get('version'));
            $('#kb-status-btn').attr('href', Config.url('status_page'));

            $('#kb-add-code-cell').click(function() {
                    Jupyter.narrative.insertAndSelectCellBelow('code');
                })
                .tooltip({
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                });

            $('#kb-add-md-cell').click(function() {
                    Jupyter.narrative.insertAndSelectCellBelow('markdown');
                })
                .tooltip({
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                });

            $('#kb-side-toggle-in').click(function() {
                Jupyter.narrative.toggleSidePanel();
            });
        }

        function loadGlobals() {
            /**
             * Error logging for detectable failure conditions.
             * Logs go through the kernel and thus are sent to the
             * main KBase logging facility (Splunk, as of this writing).
             *
             * Usage:
             *    KBFail(<is_it_fatal>, "what you were doing", "what happened");
             * Returns: false if Jupyter not initialized yet, true otherwise
             */
            window._kb_failed_once = false;
            window.KBFail = function(is_fatal, where, what) {
                if (!Jupyter || !Jupyter.notebook || !Jupyter.notebook.kernel) {
                    return false;
                }
                var code = "";
                if (window._kb_failed_once === false) {
                    code += "from biokbase.narrative.common import kblogging\n";
                    window._kb_failed_once = true;
                }
                code += "kblogging.NarrativeUIError(";
                if (is_fatal) {
                    code += "True,";
                } else {
                    code += "False,";
                }
                if (where) {
                    code += 'where="' + where + '"';
                }
                if (what) {
                    if (where) {
                        code += ", ";
                    }
                    code += 'what="' + what + '"';
                }
                code += ")\n";
                // Log the failure
                if (Jupyter.notebook.kernel.is_connected()) {
                    Jupyter.notebook.kernel.execute(code, null, { store_history: false });
                }
                return true;
            };
            /**
             * Syntactic sugar for logging error vs. fatal error.
             *
             * Same as KBFail() with boolean flag replaced by different names
             * for the function.
             */
            window.KBError = function(where, what) {
                return KBFail(false, where, what);
            };

            /**
             * KBFatal will, in addition to calling KBFail(),
             * put up a modal dialog showing the error
             * and providing some advice to users on what to do next.
             *
             * @param where (string) Where the error occurred
             * @param what  (string) What happened
             */
            window.KBFatal = function(where, what) {
                var res = KBFail(true, where, what);

                var version = Config.get('version') || 'unknown';
                var hash = Config.get('git_commit_hash') || 'unknown';
                var full_version = 'unknown';
                if (version !== 'unknown') {
                    if (hash === 'unknown') {
                        full_version = version;
                    } else {
                        full_version = version + ' (hash=' + hash + ')';
                    }
                }
                var $fatal =
                    $('<div tabindex=-1 role="dialog" aria-labelledby="kb-fatal-error" aria-hidden="true">')
                    .addClass('modal fade')
                    .append($('<div>').addClass('modal-dialog')
                        .append($('<div>').addClass('modal-content').addClass('kb-error-dialog')
                            .append($('<div>').addClass('modal-header')
                                .append($('<h4>').addClass('modal-title')
                                    .append('KBase Narrative Error')))
                            .append($('<div>').addClass('modal-body'))
                            .append($('<p>').css({ 'margin': '-1em 0 0 1em' })
                                .text('Hmmm, your narrative seemed to hit a fatal error.'))
                            .append($('<p>').css({ 'margin-left': '1em' })
                                .html('But, as a wise man once said, ' +
                                    '<strong>"Don\'t Panic!"</strong>'))
                            .append($('<p>').css({ 'margin': '1em 0 0 1em' })
                                .text('Some errors are caused by the ' +
                                    'way browsers cache information. Try manually clearing your ' +
                                    'browser cache and reloading the page.')
                                .append($('<span>')
                                    .append($('<a>')
                                        .attr({
                                            href: "http://www.refreshyourcache.com/en/home/",
                                            target: "_blank"
                                        })
                                        .text('This page'))
                                    .append($('<span>')
                                        .text(' has instructions on how to clear the cache on all major browsers.'))))
                            .append($('<p>').css({ 'margin': '1em 0 0 1em' })
                                .html('If that doesn\'t work, please ' +
                                    'contact us at ' +
                                    '<a href="http://kbase.us/contact-us/">http://kbase.us/contact-us/</a> ' +
                                    'and include the following information:'))
                            .append($('<p>').css({ margin: '1em 0 0 2em' }).addClass('kb-err-text')
                                .text('Version: ' + full_version))
                            .append($('<p>').css({ margin: '0 0 0 2em' }).addClass('kb-err-text')
                                .text('Error location: ' + where))
                            .append($('<p>').css({ margin: '0 0 0 2em' }).addClass('kb-err-text')
                                .text('Error message: ' + what))
                            .append($('<div>').addClass('modal-footer')
                                .append($('<div>')
                                    .append($('<span>').css({ float: 'left' }).addClass('kb-err-warn')
                                        .text("Note: the Narrative may not work properly until this error is fixed"))
                                    .append($('<button type="button" data-dismiss="modal">')
                                        .addClass('btn btn-default')
                                        .append('Close').click(function() {
                                            $fatal.modal('close');
                                        })
                                    )))));
                $fatal.modal('show');
            };

            // Seed the runtime module with narrative environment info.
            initializeRuntime();

        }

        function initializeRuntime() {
            var runtime = Runtime.make();
            var wsInfo = window.location.href.match(/ws\.(\d+)\.obj\.(\d+)/);
            console.log('WSINFO', wsInfo);
            if (wsInfo && wsInfo.length === 3) {
                runtime.setEnv('workspaceId', parseInt(wsInfo[1]));
            }
        }

        return {
            loadDomEvents: loadDomEvents,
            loadGlobals: loadGlobals
        };
    });